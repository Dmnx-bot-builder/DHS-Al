// Market Data Service — orchestrates providers, auto-refresh, and fallback to mock.
// Integrates ApiKeyStorageService for persistent credentials and emits
// real event-driven notifications through NotificationService.

import type {
  MarketDataProvider,
  MarketDataState,
  MarketDataMode,
  ConnectionStatus,
  ApiHealth,
  ReconnectStatus,
  ApiKeySource,
  ProviderInfo,
  OhlcCandle,
  LiveQuote,
  Timeframe,
  ErrorReason,
} from '../types';
import { MockProvider, createTwelveDataProvider } from './providers';
import { apiKeyStorageService } from './apiKeyStorageService';
import { notificationService } from './notificationService';

type Listener = (state: MarketDataState) => void;

const DEFAULT_SYMBOL = 'XAU/USD';
const DEFAULT_TIMEFRAME: Timeframe = 'M15';
const DEFAULT_LIMIT = 200;
const REFRESH_INTERVAL_MS = 15_000;
const MAX_LIVE_FAILURES = 3;
const RECONNECT_DELAY_MS = 5_000;
const MAX_RECONNECT_ATTEMPTS = 5;

const TIMEFRAME_MS: Record<Timeframe, number> = {
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
};

function classifyError(err: unknown): ErrorReason {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('api key') || lower.includes('apikey') || lower.includes('401') || lower.includes('403')) {
    if (lower.includes('missing') || lower.includes('no api key')) {
      return {
        code: 'API_KEY_MISSING',
        message: 'No API key configured',
        suggestedAction: 'Add your TwelveData API key in Settings to enable live market data.',
      };
    }
    return {
      code: 'AUTH_FAILED',
      message: 'Authentication failed — invalid API key',
      suggestedAction: 'Verify your TwelveData API key is correct and active. Update it in Settings.',
    };
  }
  if (lower.includes('429') || lower.includes('rate limit')) {
    return {
      code: 'RATE_LIMIT_REACHED',
      message: 'TwelveData rate limit reached',
      suggestedAction: 'Wait for the rate limit window to reset or upgrade your TwelveData plan.',
    };
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch') || lower.includes('err_network')) {
    return {
      code: 'NETWORK_LOST',
      message: 'Network connection lost',
      suggestedAction: 'Check your internet connection. The system will auto-reconnect when network is restored.',
    };
  }
  if (lower.includes('unavailable') || lower.includes('500') || lower.includes('502') || lower.includes('503')) {
    return {
      code: 'PROVIDER_UNAVAILABLE',
      message: 'TwelveData provider is temporarily unavailable',
      suggestedAction: 'The provider may be experiencing downtime. Auto-reconnect will retry shortly.',
    };
  }
  return {
    code: 'UNKNOWN',
    message: msg,
    suggestedAction: 'If the issue persists, try changing your API key or contact support.',
  };
}

function resolveProvider(): { provider: MarketDataProvider; mode: MarketDataMode; source: ApiKeySource } {
  const storedKey = apiKeyStorageService.getApiKey();

  if (storedKey && storedKey.trim().length > 0) {
    const source = apiKeyStorageService.getSource();
    console.info(`[MarketData] LIVE MODE active — TwelveData provider initialized (source: ${source}, key: ${storedKey.slice(0, 8)}…${storedKey.slice(-4)})`);
    return {
      provider: createTwelveDataProvider(storedKey),
      mode: 'LIVE',
      source,
    };
  }

  console.info('[MarketData] MOCK MODE active — no API key configured');
  return { provider: MockProvider, mode: 'MOCK', source: 'none' };
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
  private lastLiveUpdate: number | null = null;
  private error: string | null = null;
  private errorReason: ErrorReason | null = null;
  private apiHealth: ApiHealth = 'UNKNOWN';
  private reconnectStatus: ReconnectStatus = 'IDLE';
  private autoRefreshEnabled: boolean = true;
  private apiKeySource: ApiKeySource = 'none';
  private maskedApiKey: string | null = null;
  private consecutiveFailures = 0;
  private reconnectAttempts = 0;
  private listeners = new Set<Listener>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isFetching = false;
  private originalLiveProvider: MarketDataProvider | null = null;
  private started = false;
  private lastNotifiedMode: MarketDataMode | null = null;
  private lastNotifiedStatus: ConnectionStatus | null = null;

  constructor() {
    const { provider, mode, source } = resolveProvider();
    this.provider = provider;
    this.mode = mode;
    this.apiKeySource = source;
    this.maskedApiKey = apiKeyStorageService.getMaskedKey();
    if (mode === 'LIVE') {
      this.originalLiveProvider = provider;
      this.apiHealth = 'VALID';
    } else if (source === 'none') {
      this.apiHealth = 'MISSING';
    }

    // Subscribe to API key storage changes so we can react to user updates
    apiKeyStorageService.subscribe(() => {
      this.handleApiKeyChange();
    });
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
      lastLiveUpdate: this.lastLiveUpdate,
      error: this.error,
      errorReason: this.errorReason,
      apiHealth: this.apiHealth,
      reconnectStatus: this.reconnectStatus,
      autoRefreshEnabled: this.autoRefreshEnabled,
      apiKeySource: this.apiKeySource,
      maskedApiKey: this.maskedApiKey,
      consecutiveFailures: this.consecutiveFailures,
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

  private emitNotification(
    subtype: import('../types/notification').NotificationSubtype,
    title: string,
    description: string,
    meta?: Record<string, string | number | boolean>,
  ) {
    const category = subtype.startsWith('API_KEY') || subtype === 'SETTINGS_UPDATED'
      ? 'SYSTEM' as const
      : subtype === 'SWITCHED_TO_MOCK' || subtype === 'RETURNED_TO_LIVE' || subtype === 'AUTO_RECONNECT_SUCCESS'
        ? 'SYSTEM' as const
        : 'SYSTEM' as const;
    notificationService.add({ category, subtype, title, description, meta });
  }

  async start(symbol: string = DEFAULT_SYMBOL, timeframe: Timeframe = DEFAULT_TIMEFRAME) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.status = 'CONNECTING';
    this.error = null;
    this.errorReason = null;
    this.consecutiveFailures = 0;
    this.reconnectAttempts = 0;
    this.started = true;
    this.notify();

    console.info(`[MarketData] Starting — symbol: ${symbol}, timeframe: ${timeframe}, mode: ${this.mode}`);
    await this.refresh();

    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      if (this.autoRefreshEnabled) this.refresh();
    }, REFRESH_INTERVAL_MS);
    console.info(`[MarketData] Auto-refresh enabled — every ${REFRESH_INTERVAL_MS / 1000}s`);
  }

  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.autoRefreshEnabled = false;
    this.status = 'DISCONNECTED';
    this.started = false;
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

  setAutoRefresh(enabled: boolean) {
    this.autoRefreshEnabled = enabled;
    this.notify();
    console.info(`[MarketData] Auto-refresh ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * User-initiated reconnect attempt — resets failure counters and
   * tries to re-establish a live connection using the stored key.
   */
  async reconnect(): Promise<boolean> {
    const key = apiKeyStorageService.getApiKey();
    if (!key) {
      this.apiHealth = 'MISSING';
      this.errorReason = {
        code: 'API_KEY_MISSING',
        message: 'No API key configured',
        suggestedAction: 'Add your TwelveData API key in Settings to enable live market data.',
      };
      this.error = this.errorReason.message;
      this.notify();
      return false;
    }

    this.reconnectStatus = 'IN_PROGRESS';
    this.status = 'CONNECTING';
    this.consecutiveFailures = 0;
    this.reconnectAttempts = 0;
    this.notify();
    console.info('[MarketData] Manual reconnect initiated');

    try {
      const testProvider = createTwelveDataProvider(key);
      const [candles, quote] = await Promise.all([
        testProvider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        testProvider.fetchQuote(this.symbol).catch(() => null),
      ]);

      this.provider = testProvider;
      this.originalLiveProvider = testProvider;
      this.mode = 'LIVE';
      this.apiKeySource = apiKeyStorageService.getSource();
      this.maskedApiKey = apiKeyStorageService.getMaskedKey();
      this.candles = candles;
      this.latestQuote = quote;
      this.status = 'CONNECTED';
      this.lastUpdated = Date.now();
      this.lastLiveUpdate = Date.now();
      this.error = null;
      this.errorReason = null;
      this.apiHealth = 'VALID';
      this.reconnectStatus = 'SUCCEEDED';
      this.notify();

      this.emitNotification(
        'AUTO_RECONNECT_SUCCESS',
        'Reconnection Successful',
        `TwelveData live market data restored for ${this.symbol}.`,
      );

      console.info('[MarketData] Manual reconnect successful — LIVE mode active');
      return true;
    } catch (err) {
      const reason = classifyError(err);
      this.reconnectStatus = 'FAILED';
      this.apiHealth = reason.code === 'AUTH_FAILED' ? 'INVALID' : 'UNKNOWN';
      this.error = reason.message;
      this.errorReason = reason;
      this.status = this.candles.length > 0 ? 'CONNECTED' : 'ERROR';
      this.notify();
      console.error(`[MarketData] Manual reconnect failed: ${reason.message}`);
      return false;
    }
  }

  /**
   * Tests the connection with the currently stored key without
   * changing the active provider. Returns a human-readable result.
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const key = apiKeyStorageService.getApiKey();
    if (!key) {
      return {
        success: false,
        message: 'No API key configured. Add your TwelveData API key first.',
      };
    }

    try {
      const testProvider = createTwelveDataProvider(key);
      const quote = await testProvider.fetchQuote(this.symbol);
      this.apiHealth = 'VALID';
      this.notify();
      return {
        success: true,
        message: `Connection successful — ${this.symbol} price: ${quote.price.toFixed(2)}`,
      };
    } catch (err) {
      const reason = classifyError(err);
      this.apiHealth = reason.code === 'AUTH_FAILED' ? 'INVALID' : 'UNKNOWN';
      this.notify();
      return { success: false, message: reason.message };
    }
  }

  /**
   * Called when the user saves, updates, or removes the API key.
   * Re-initializes the provider and attempts to reconnect live.
   */
  private async handleApiKeyChange() {
    const key = apiKeyStorageService.getApiKey();
    this.apiKeySource = apiKeyStorageService.getSource();
    this.maskedApiKey = apiKeyStorageService.getMaskedKey();

    if (key) {
      console.info('[MarketData] API key changed — attempting live reconnect');
      this.consecutiveFailures = 0;
      this.reconnectAttempts = 0;
      this.reconnectStatus = 'IN_PROGRESS';
      this.status = 'CONNECTING';
      this.notify();

      try {
        const newProvider = createTwelveDataProvider(key);
        const [candles, quote] = await Promise.all([
          newProvider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
          newProvider.fetchQuote(this.symbol).catch(() => null),
        ]);

        this.provider = newProvider;
        this.originalLiveProvider = newProvider;
        this.mode = 'LIVE';
        this.candles = candles;
        this.latestQuote = quote;
        this.status = 'CONNECTED';
        this.lastUpdated = Date.now();
        this.lastLiveUpdate = Date.now();
        this.error = null;
        this.errorReason = null;
        this.apiHealth = 'VALID';
        this.reconnectStatus = 'SUCCEEDED';
        this.notify();

        if (this.lastNotifiedMode !== 'LIVE') {
          this.emitNotification(
            'RETURNED_TO_LIVE',
            'Live Market Mode Restored',
            `TwelveData connection active — receiving real-time ${this.symbol} data.`,
          );
          this.lastNotifiedMode = 'LIVE';
        }
        console.info('[MarketData] API key change — LIVE mode restored');
      } catch (err) {
        const reason = classifyError(err);
        this.apiHealth = reason.code === 'AUTH_FAILED' ? 'INVALID' : 'UNKNOWN';
        this.error = reason.message;
        this.errorReason = reason;
        this.reconnectStatus = 'FAILED';

        this.emitNotification(
          'API_KEY_INVALID',
          'API Key Validation Failed',
          reason.message,
        );

        // Fall back to mock so data keeps flowing
        this.fallbackToMock(reason.message);
      }
    } else {
      // Key was removed — switch to mock
      console.info('[MarketData] API key removed — switching to MOCK');
      this.provider = MockProvider;
      this.originalLiveProvider = null;
      this.mode = 'MOCK';
      this.apiHealth = 'MISSING';
      this.errorReason = {
        code: 'API_KEY_MISSING',
        message: 'No API key configured',
        suggestedAction: 'Add your TwelveData API key in Settings to enable live market data.',
      };
      this.error = this.errorReason.message;
      this.notify();

      if (this.started) {
        await this.refresh();
      }
    }
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
      if (this.mode === 'LIVE') {
        this.lastLiveUpdate = Date.now();
      }
      this.error = null;
      this.errorReason = null;
      this.consecutiveFailures = 0;
      this.reconnectStatus = 'IDLE';

      if (this.lastNotifiedStatus !== 'CONNECTED' && this.lastNotifiedStatus !== null) {
        if (this.mode === 'LIVE') {
          this.emitNotification(
            'LIVE_CONNECTED',
            'Live Market Connected',
            `TwelveData provider active — receiving real-time ${this.symbol} market data.`,
          );
        }
        this.lastNotifiedStatus = 'CONNECTED';
      }
      if (this.lastNotifiedMode !== this.mode) {
        this.lastNotifiedMode = this.mode;
      }

      if (this.mode === 'LIVE') {
        console.info(`[MarketData] LIVE data received — ${candles.length} candles, price: ${quote?.price ?? 'N/A'}`);
      }
    } catch (err) {
      const reason = classifyError(err);
      this.consecutiveFailures++;
      console.error(`[MarketData] Refresh failed (${this.consecutiveFailures}/${MAX_LIVE_FAILURES}): ${reason.message}`);

      if (this.mode === 'LIVE' && this.consecutiveFailures >= MAX_LIVE_FAILURES) {
        console.warn(`[MarketData] ${MAX_LIVE_FAILURES} consecutive failures — falling back to MOCK`);
        this.fallbackToMock(reason.message);
      } else if (this.mode === 'LIVE' && this.candles.length === 0) {
        this.fallbackToMock(reason.message);
      } else {
        this.error = this.mode === 'LIVE'
          ? `Live data error (attempt ${this.consecutiveFailures}/${MAX_LIVE_FAILURES}): ${reason.message}`
          : reason.message;
        this.errorReason = reason;
        this.status = this.candles.length > 0 ? 'CONNECTED' : 'ERROR';

        if (this.mode === 'LIVE') {
          this.scheduleAutoReconnect();
        }
      }

      if (this.lastNotifiedStatus !== 'ERROR' && this.status === 'ERROR') {
        this.emitNotification(
          'LIVE_DISCONNECTED',
          'Live Market Disconnected',
          reason.message,
        );
        this.lastNotifiedStatus = 'ERROR';
      }
    } finally {
      this.isFetching = false;
      this.notify();
    }
  }

  private fallbackToMock(reason: string) {
    const wasLive = this.mode === 'LIVE';
    console.warn(`[MarketData] Falling back to MOCK — reason: ${reason}`);
    this.provider = MockProvider;
    this.mode = 'MOCK';
    this.error = `Live data unavailable (${reason}). Switched to mock data.`;
    this.status = 'CONNECTING';
    this.notify();

    if (wasLive) {
      this.emitNotification(
        'SWITCHED_TO_MOCK',
        'Switched to Mock Mode',
        `Live data unavailable — ${reason}. Using mock data while reconnection is attempted.`,
      );
    }

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

    // Schedule auto-reconnect attempts to restore live mode
    if (wasLive) {
      this.scheduleAutoReconnect();
    }
  }

  private scheduleAutoReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[MarketData] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached — staying in MOCK`);
      this.reconnectStatus = 'FAILED';
      this.notify();
      return;
    }

    this.reconnectStatus = 'PENDING';
    this.reconnectAttempts++;
    const attempt = this.reconnectAttempts;
    const delay = RECONNECT_DELAY_MS * attempt;
    console.info(`[MarketData] Auto-reconnect scheduled (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      const key = apiKeyStorageService.getApiKey();
      if (!key) {
        this.reconnectStatus = 'FAILED';
        this.apiHealth = 'MISSING';
        this.notify();
        return;
      }

      this.reconnectStatus = 'IN_PROGRESS';
      this.notify();

      try {
        const liveProvider = createTwelveDataProvider(key);
        const candles = await liveProvider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT);
        const quote = await liveProvider.fetchQuote(this.symbol).catch(() => null);

        this.provider = liveProvider;
        this.originalLiveProvider = liveProvider;
        this.mode = 'LIVE';
        this.candles = candles;
        this.latestQuote = quote;
        this.status = 'CONNECTED';
        this.lastUpdated = Date.now();
        this.lastLiveUpdate = Date.now();
        this.error = null;
        this.errorReason = null;
        this.apiHealth = 'VALID';
        this.reconnectStatus = 'SUCCEEDED';
        this.consecutiveFailures = 0;
        this.reconnectAttempts = 0;
        this.notify();

        this.emitNotification(
          'AUTO_RECONNECT_SUCCESS',
          'Auto-Reconnection Successful',
          `TwelveData live market data restored for ${this.symbol} after ${attempt} attempt(s).`,
        );
        console.info('[MarketData] Auto-reconnect successful — LIVE mode restored');
      } catch (err) {
        const reason = classifyError(err);
        console.warn(`[MarketData] Auto-reconnect attempt ${attempt} failed: ${reason.message}`);
        this.reconnectStatus = 'FAILED';
        if (reason.code === 'AUTH_FAILED') {
          this.apiHealth = 'INVALID';
          this.notify();
          // Don't retry auth failures — key is invalid
          return;
        }
        // Schedule next attempt
        this.scheduleAutoReconnect();
      }
    }, delay);
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
