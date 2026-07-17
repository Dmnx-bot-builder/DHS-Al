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
    return {
      provider: createTwelveDataProvider(apiKey),
      mode: 'LIVE',
    };
  }

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

  constructor() {
    const { provider, mode } = resolveProvider();
    this.provider = provider;
    this.mode = mode;
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
    this.notify();

    await this.refresh();

    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
  }

  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.status = 'DISCONNECTED';
    this.notify();
  }

  async setTimeframe(timeframe: Timeframe) {
    if (this.timeframe === timeframe) return;
    this.timeframe = timeframe;
    this.candles = [];
    this.status = 'CONNECTING';
    this.notify();
    await this.refresh();
  }

  async setSymbol(symbol: string) {
    if (this.symbol === symbol) return;
    this.symbol = symbol;
    this.candles = [];
    this.status = 'CONNECTING';
    this.notify();
    await this.refresh();
  }

  private async refresh() {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const [candles, quote] = await Promise.all([
        this.provider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        this.provider.fetchQuote(this.symbol).catch(() => null),
      ]);

      this.candles = candles;
      this.latestQuote = quote;
      this.status = 'CONNECTED';
      this.lastUpdated = Date.now();
      this.error = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      if (this.mode === 'LIVE' && this.candles.length === 0) {
        this.fallbackToMock(message);
      } else {
        this.error = message;
        this.status = this.candles.length > 0 ? 'CONNECTED' : 'ERROR';
      }
    } finally {
      this.isFetching = false;
      this.notify();
    }
  }

  private fallbackToMock(reason: string) {
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
      })
      .catch(() => {
        this.status = 'ERROR';
        this.notify();
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
