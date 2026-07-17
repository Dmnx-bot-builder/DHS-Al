// Market Data Service — orchestrates providers, auto-refresh, and fallback to mock

import type {
  MarketDataProvider,
  MarketDataState,
  MarketDataMode,
  ConnectionStatus,
  ProviderInfo,
  OhlcCandle,
  LiveQuote,
  Timeframe,
} from '../types';
import { MockProvider, createTwelveDataProvider } from './providers';

type Listener = (state: MarketDataState) => void;

const DEFAULT_SYMBOL = 'XAU/USD';
const DEFAULT_TIMEFRAME: Timeframe = 'M15';
const DEFAULT_LIMIT = 200;
const REFRESH_INTERVAL_MS = 15_000;
const MAX_LIVE_FAILURES = 3;

const TIMEFRAME_MS: Record<Timeframe, number> = {
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
};

function resolveProvider(): { provider: MarketDataProvider; mode: MarketDataMode } {
  const apiKey = import.meta.env.VITE_TWELVEDATA_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
    console.info(`[MarketData] LIVE MODE active — TwelveData provider initialized (key: ${apiKey.slice(0, 8)}…${apiKey.slice(-4)})`);
    return {
      provider: createTwelveDataProvider(apiKey),
      mode: 'LIVE',
    };
  }

  console.info('[MarketData] MOCK MODE active — no VITE_TWELVEDATA_API_KEY found');
  return { provider: MockProvider, mode: 'MOCK' };
}

class MarketDataService {
  private provider: MarketDataProvider;
  private mode: MarketDataMode;
  private symbol: string = DEFAULT_SYMBOL;
  private timeframe: Timeframe = DEFAULT_TIMEFRAME;
  private candles: OhlcCandle[] = [];
  private latestQuote: LiveQuote | null = null;
  private status: ConnectionStatus = 'DISCONNECTED';
  private lastUpdated: number | null = null;
  private error: string | null = null;
  private listeners = new Set<Listener>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private isFetching = false;
  private consecutiveFailures = 0;
  private originalLiveProvider: MarketDataProvider | null = null;

  constructor() {
    const { provider, mode } = resolveProvider();
    this.provider = provider;
    this.mode = mode;
    if (mode === 'LIVE') {
      this.originalLiveProvider = provider;
    }
  }

  getProviderInfo(): ProviderInfo {
    return { name: this.provider.name, label: this.provider.label, isLive: this.provider.isLive };
  }

  getState(): MarketDataState {
    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      candles: [...this.candles],
      latestQuote: this.latestQuote,
      mode: this.mode,
      status: this.status,
      provider: this.getProviderInfo(),
      lastUpdated: this.lastUpdated,
      error: this.error,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  async start(symbol: string = DEFAULT_SYMBOL, timeframe: Timeframe = DEFAULT_TIMEFRAME) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.status = 'CONNECTING';
    this.error = null;
    this.consecutiveFailures = 0;
    this.notify();

    console.info(`[MarketData] Starting — symbol: ${symbol}, timeframe: ${timeframe}, mode: ${this.mode}`);
    await this.refresh();

    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
    console.info(`[MarketData] Auto-refresh enabled — every ${REFRESH_INTERVAL_MS / 1000}s`);
  }

  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.status = 'DISCONNECTED';
    this.notify();
    console.info('[MarketData] Stopped');
  }

  async setTimeframe(timeframe: Timeframe) {
    if (this.timeframe === timeframe) return;
    this.timeframe = timeframe;
    this.candles = [];
    this.status = 'CONNECTING';
    this.consecutiveFailures = 0;
    this.notify();
    console.info(`[MarketData] Timeframe changed to ${timeframe}`);
    await this.refresh();
  }

  async setSymbol(symbol: string) {
    if (this.symbol === symbol) return;
    this.symbol = symbol;
    this.candles = [];
    this.status = 'CONNECTING';
    this.consecutiveFailures = 0;
    this.notify();
    console.info(`[MarketData] Symbol changed to ${symbol}`);
    await this.refresh();
  }

  private async refresh() {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const [candles, quote] = await Promise.all([
        this.provider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        this.provider.fetchQuote(this.symbol).catch((err) => {
          console.warn(`[MarketData] Quote fetch failed (non-fatal): ${err instanceof Error ? err.message : err}`);
          return null;
        }),
      ]);

      this.candles = candles;
      this.latestQuote = quote;
      this.status = 'CONNECTED';
      this.lastUpdated = Date.now();
      this.error = null;
      this.consecutiveFailures = 0;

      if (this.mode === 'LIVE') {
        console.info(`[MarketData] LIVE data received — ${candles.length} candles, price: ${quote?.price ?? 'N/A'}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.consecutiveFailures++;
      console.error(`[MarketData] Refresh failed (${this.consecutiveFailures}/${MAX_LIVE_FAILURES}): ${message}`);

      if (this.mode === 'LIVE' && this.consecutiveFailures >= MAX_LIVE_FAILURES) {
        console.warn(`[MarketData] ${MAX_LIVE_FAILURES} consecutive failures — falling back to MOCK`);
        this.fallbackToMock(message);
      } else if (this.mode === 'LIVE' && this.candles.length === 0) {
        this.fallbackToMock(message);
      } else {
        this.error = this.mode === 'LIVE'
          ? `Live data error (attempt ${this.consecutiveFailures}/${MAX_LIVE_FAILURES}): ${message}`
          : message;
        this.status = this.candles.length > 0 ? 'CONNECTED' : 'ERROR';
      }
    } finally {
      this.isFetching = false;
      this.notify();
    }
  }

  private fallbackToMock(reason: string) {
    console.warn(`[MarketData] Falling back to MOCK — reason: ${reason}`);
    this.provider = MockProvider;
    this.mode = 'MOCK';
    this.error = `Live data unavailable (${reason}). Switched to mock data.`;
    this.status = 'CONNECTING';
    this.notify();

    this.provider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT)
      .then((candles) => {
        this.candles = candles;
        this.status = 'CONNECTED';
        this.lastUpdated = Date.now();
        this.notify();
        console.info('[MarketData] MOCK fallback successful — data flowing');
      })
      .catch((err) => {
        this.status = 'ERROR';
        this.error = `Mock fallback also failed: ${err instanceof Error ? err.message : err}`;
        this.notify();
        console.error(`[MarketData] Mock fallback failed: ${err instanceof Error ? err.message : err}`);
      });
  }

  hasNewCandleFormed(): boolean {
    if (this.candles.length < 2) return false;
    const interval = TIMEFRAME_MS[this.timeframe] ?? TIMEFRAME_MS.M15;
    const lastCandleTime = this.candles[this.candles.length - 1].time * 1000;
    const now = Date.now();
    return now - lastCandleTime >= interval;
  }
}

export const marketDataService = new MarketDataService();
