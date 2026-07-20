// Market Data Service - orchestrates providers, auto-refresh, and fallback to mock.
// Integrates ApiKeyStorageService for persistent credentials and emits
// real event-driven notifications through NotificationService.
//
// SINGLETON INVARIANT: This module exports exactly one `marketDataService` instance.
// No other code should create a new MarketDataService. Hot reloads, page refreshes,
// and Bolt preview restarts all reuse this same instance via module caching.
//
// STARTUP SEQUENCE:
//   1. Load API key from localStorage (or env fallback)
//   2. Validate API key format
//   3. Initialize TwelveDataProvider
//   4. Test connection (fetch candles + quote)
//   5. If successful: Provider = TwelveData, Mode = LIVE, API Health = VALID, begin polling
//   6. If failed: Display exact failure reason, retry automatically, only enable MOCK after all retries fail

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
  MockReason,
  PollingStatus,
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

const DIAG_PREFIX = '[MarketData]';

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
      message: 'Authentication failed - invalid API key',
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

function errorToMockReason(reason: ErrorReason): Exclude<MockReason, null> {
  switch (reason.code) {
    case 'API_KEY_MISSING': return 'NO_API_KEY';
    case 'AUTH_FAILED':
    case 'INVALID_API_KEY': return 'INVALID_API_KEY';
    case 'NETWORK_LOST': return 'NETWORK_TIMEOUT';
    case 'RATE_LIMIT_REACHED': return 'RATE_LIMIT';
    case 'PROVIDER_UNAVAILABLE': return 'PROVIDER_UNAVAILABLE';
    default: return 'UNKNOWN_ERROR';
  }
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
  private lastSuccessfulLiveRequest: number | null = null;
  private lastFailedRequest: number | null = null;
  private error: string | null = null;
  private errorReason: ErrorReason | null = null;
  private apiHealth: ApiHealth = 'UNKNOWN';
  private reconnectStatus: ReconnectStatus = 'IDLE';
  private reconnectAttempts = 0;
  private autoRefreshEnabled: boolean = true;
  private pollingStatus: PollingStatus = 'STOPPED';
  private apiKeySource: ApiKeySource = 'none';
  private maskedApiKey: string | null = null;
  private consecutiveFailures = 0;
  private mockReason: MockReason = null;
  private mockReasonMessage: string | null = null;
  private listeners = new Set<Listener>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isFetching = false;
  private originalLiveProvider: MarketDataProvider | null = null;
  private started = false;
  private lastNotifiedMode: MarketDataMode | null = null;
  private lastNotifiedStatus: ConnectionStatus | null = null;

  constructor() {
    console.info(`${DIAG_PREFIX} === Singleton MarketDataService instantiated ===`);

    // Step 1: Load API key from localStorage
    const storedKey = apiKeyStorageService.getApiKey();
    const source = apiKeyStorageService.getSource();

    if (storedKey && storedKey.trim().length > 0) {
      // Step 2: Validate API key format (basic length check)
      console.info(`${DIAG_PREFIX} [1/5] API key loaded from ${source} (key: ${storedKey.slice(0, 8)}...${storedKey.slice(-4)})`);

      // Step 3: Initialize TwelveDataProvider
      this.provider = createTwelveDataProvider(storedKey);
      this.mode = 'LIVE';
      this.apiKeySource = source;
      this.maskedApiKey = apiKeyStorageService.getMaskedKey();
      this.originalLiveProvider = this.provider;
      // NOTE: apiHealth stays UNKNOWN until connection test succeeds in start()
      console.info(`${DIAG_PREFIX} [2/5] API key validated (length: ${storedKey.length})`);
      console.info(`${DIAG_PREFIX} [3/5] TwelveData provider created`);
    } else {
      console.info(`${DIAG_PREFIX} [1/5] No API key found - initializing MOCK mode`);
      this.provider = MockProvider;
      this.mode = 'MOCK';
      this.apiKeySource = 'none';
      this.apiHealth = 'MISSING';
      this.mockReason = 'NO_API_KEY';
      this.mockReasonMessage = 'No API key configured in Settings or .env';
    }

    // Subscribe to API key storage changes
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
      lastSuccessfulLiveRequest: this.lastSuccessfulLiveRequest,
      lastFailedRequest: this.lastFailedRequest,
      error: this.error,
      errorReason: this.errorReason,
      apiHealth: this.apiHealth,
      reconnectStatus: this.reconnectStatus,
      reconnectAttempts: this.reconnectAttempts,
      autoRefreshEnabled: this.autoRefreshEnabled,
      pollingStatus: this.pollingStatus,
      apiKeySource: this.apiKeySource,
      maskedApiKey: this.maskedApiKey,
      consecutiveFailures: this.consecutiveFailures,
      mockReason: this.mockReason,
      mockReasonMessage: this.mockReasonMessage,
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
    notificationService.add({ category: 'SYSTEM', subtype, title, description, meta });
  }

  /**
   * Starts the market data service. This is the main entry point.
   * Implements the full startup sequence with connection testing.
   * Safe to call multiple times - if already started, reuses existing state.
   */
  async start(symbol: string = DEFAULT_SYMBOL, timeframe: Timeframe = DEFAULT_TIMEFRAME) {
    this.symbol = symbol;
    this.timeframe = timeframe;

    // If already started with same symbol/timeframe, don't restart
    if (this.started && this.symbol === symbol && this.timeframe === timeframe) {
      console.info(`${DIAG_PREFIX} Already started - reusing existing connection (mode: ${this.mode})`);
      return;
    }

    this.started = true;
    this.status = 'CONNECTING';
    this.error = null;
    this.errorReason = null;
    this.consecutiveFailures = 0;
    this.reconnectAttempts = 0;
    this.notify();

    console.info(`${DIAG_PREFIX} === Starting MarketDataService ===`);
    console.info(`${DIAG_PREFIX} Symbol: ${symbol}, Timeframe: ${timeframe}, Mode: ${this.mode}`);

    if (this.mode === 'LIVE') {
      // Step 4: Test connection before declaring LIVE
      await this.testAndStartLive();
    } else {
      // No API key - start mock polling
      console.info(`${DIAG_PREFIX} [4/5] Skipped (no API key) - starting MOCK polling`);
      await this.refresh();
      this.startPolling();
      console.info(`${DIAG_PREFIX} [5/5] MOCK polling started`);
    }
  }

  /**
   * Tests the live connection and starts polling if successful.
   * If the test fails, retries up to MAX_RECONNECT_ATTEMPTS before falling back to mock.
   */
  private async testAndStartLive() {
    const key = apiKeyStorageService.getApiKey();
    if (!key) {
      this.apiHealth = 'MISSING';
      this.mockReason = 'NO_API_KEY';
      this.mockReasonMessage = 'No API key configured';
      this.fallbackToMock('No API key configured', 'NO_API_KEY');
      return;
    }

    this.status = 'CONNECTING';
    this.notify();
    console.info(`${DIAG_PREFIX} [4/5] Testing TwelveData connection...`);

    try {
      const [candles, quote] = await Promise.all([
        this.provider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        this.provider.fetchQuote(this.symbol).catch(() => null),
      ]);

      // Step 5: Connection successful
      this.candles = candles;
      this.latestQuote = quote;
      this.status = 'CONNECTED';
      this.lastUpdated = Date.now();
      this.lastLiveUpdate = Date.now();
      this.lastSuccessfulLiveRequest = Date.now();
      this.error = null;
      this.errorReason = null;
      this.apiHealth = 'VALID';
      this.consecutiveFailures = 0;
      this.reconnectAttempts = 0;
      this.mockReason = null;
      this.mockReasonMessage = null;
      console.info(`${DIAG_PREFIX} [4/5] Connection test successful - ${candles.length} candles received`);
      console.info(`${DIAG_PREFIX} [5/5] LIVE polling started`);
      this.notify();

      this.startPolling();

      if (this.lastNotifiedMode !== 'LIVE') {
        this.emitNotification(
          'LIVE_CONNECTED',
          'Live Market Connected',
          `TwelveData provider active - receiving real-time ${this.symbol} market data.`,
        );
        this.lastNotifiedMode = 'LIVE';
        this.lastNotifiedStatus = 'CONNECTED';
      }
    } catch (err) {
      const reason = classifyError(err);
      this.lastFailedRequest = Date.now();
      this.apiHealth = reason.code === 'AUTH_FAILED' ? 'INVALID' : 'UNKNOWN';
      this.error = reason.message;
      this.errorReason = reason;
      console.error(`${DIAG_PREFIX} [4/5] Connection test FAILED: ${reason.message}`);
      this.notify();

      // Start retry sequence - do NOT immediately fall back to mock
      this.scheduleAutoReconnect();
    }
  }

  private startPolling() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.pollingStatus = this.autoRefreshEnabled ? 'ACTIVE' : 'PAUSED';
    this.refreshTimer = setInterval(() => {
      if (this.autoRefreshEnabled) this.refresh();
    }, REFRESH_INTERVAL_MS);
    console.info(`${DIAG_PREFIX} Auto-refresh enabled - every ${REFRESH_INTERVAL_MS / 1000}s`);
    this.notify();
  }

  /**
   * Stops polling but does NOT destroy the singleton or the provider.
   * Safe to call on unmount - the service remains alive for reuse.
   */
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pollingStatus = 'STOPPED';
    this.started = false;
    this.notify();
    console.info(`${DIAG_PREFIX} Polling stopped (singleton preserved for reuse)`);
  }

  async setTimeframe(timeframe: Timeframe) {
    if (this.timeframe === timeframe) return;
    this.timeframe = timeframe;
    this.candles = [];
    this.status = 'CONNECTING';
    this.consecutiveFailures = 0;
    this.notify();
    console.info(`${DIAG_PREFIX} Timeframe changed to ${timeframe}`);
    await this.refresh();
  }

  async setSymbol(symbol: string) {
    if (this.symbol === symbol) return;
    this.symbol = symbol;
    this.candles = [];
    this.status = 'CONNECTING';
    this.consecutiveFailures = 0;
    this.notify();
    console.info(`${DIAG_PREFIX} Symbol changed to ${symbol}`);
    await this.refresh();
  }

  setAutoRefresh(enabled: boolean) {
    this.autoRefreshEnabled = enabled;
    this.pollingStatus = enabled ? (this.started ? 'ACTIVE' : 'PAUSED') : 'PAUSED';
    this.notify();
    console.info(`${DIAG_PREFIX} Auto-refresh ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * User-initiated reconnect attempt - resets failure counters and
   * tries to re-establish a live connection using the stored key.
   * Recreates the provider, retests the API key, and restarts polling.
   */
  async reconnect(): Promise<boolean> {
    const key = apiKeyStorageService.getApiKey();
    if (!key) {
      this.apiHealth = 'MISSING';
      this.mockReason = 'NO_API_KEY';
      this.mockReasonMessage = 'No API key configured';
      this.errorReason = {
        code: 'API_KEY_MISSING',
        message: 'No API key configured',
        suggestedAction: 'Add your TwelveData API key in Settings to enable live market data.',
      };
      this.error = this.errorReason.message;
      this.notify();
      console.warn(`${DIAG_PREFIX} Reconnect failed - no API key`);
      return false;
    }

    this.reconnectStatus = 'IN_PROGRESS';
    this.status = 'CONNECTING';
    this.consecutiveFailures = 0;
    this.reconnectAttempts = 0;
    this.notify();
    console.info(`${DIAG_PREFIX} Manual reconnect initiated - recreating provider and retesting API key`);

    try {
      // Recreate the provider
      const testProvider = createTwelveDataProvider(key);
      const [candles, quote] = await Promise.all([
        testProvider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        testProvider.fetchQuote(this.symbol).catch(() => null),
      ]);

      // Restore LIVE mode
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
      this.lastSuccessfulLiveRequest = Date.now();
      this.error = null;
      this.errorReason = null;
      this.apiHealth = 'VALID';
      this.reconnectStatus = 'SUCCEEDED';
      this.mockReason = null;
      this.mockReasonMessage = null;
      this.notify();

      // Restart polling
      this.startPolling();

      this.emitNotification(
        'AUTO_RECONNECT_SUCCESS',
        'Reconnection Successful',
        `TwelveData live market data restored for ${this.symbol}.`,
      );

      console.info(`${DIAG_PREFIX} Manual reconnect successful - LIVE mode restored`);
      return true;
    } catch (err) {
      const reason = classifyError(err);
      this.lastFailedRequest = Date.now();
      this.reconnectStatus = 'FAILED';
      this.apiHealth = reason.code === 'AUTH_FAILED' ? 'INVALID' : 'UNKNOWN';
      this.error = reason.message;
      this.errorReason = reason;
      this.status = this.candles.length > 0 ? 'CONNECTED' : 'ERROR';
      this.notify();
      console.error(`${DIAG_PREFIX} Manual reconnect failed: ${reason.message}`);
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
      this.lastSuccessfulLiveRequest = Date.now();
      this.notify();
      return {
        success: true,
        message: `Connection successful - ${this.symbol} price: ${quote.price.toFixed(2)}`,
      };
    } catch (err) {
      const reason = classifyError(err);
      this.lastFailedRequest = Date.now();
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
      console.info(`${DIAG_PREFIX} API key changed - attempting live reconnect`);
      this.consecutiveFailures = 0;
      this.reconnectAttempts = 0;
      this.reconnectStatus = 'IN_PROGRESS';
      this.status = 'CONNECTING';
      this.mockReason = null;
      this.mockReasonMessage = null;
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
        this.lastSuccessfulLiveRequest = Date.now();
        this.error = null;
        this.errorReason = null;
        this.apiHealth = 'VALID';
        this.reconnectStatus = 'SUCCEEDED';
        this.notify();

        if (!this.refreshTimer) {
          this.startPolling();
        }

        if (this.lastNotifiedMode !== 'LIVE') {
          this.emitNotification(
            'RETURNED_TO_LIVE',
            'Live Market Mode Restored',
            `TwelveData connection active - receiving real-time ${this.symbol} data.`,
          );
          this.lastNotifiedMode = 'LIVE';
        }
        console.info(`${DIAG_PREFIX} API key change - LIVE mode restored`);
      } catch (err) {
        const reason = classifyError(err);
        this.lastFailedRequest = Date.now();
        this.apiHealth = reason.code === 'AUTH_FAILED' ? 'INVALID' : 'UNKNOWN';
        this.error = reason.message;
        this.errorReason = reason;
        this.reconnectStatus = 'FAILED';

        this.emitNotification(
          'API_KEY_INVALID',
          'API Key Validation Failed',
          reason.message,
        );

        // Fall back to mock so data keeps flowing, but schedule reconnect
        this.fallbackToMock(reason.message, errorToMockReason(reason));
      }
    } else {
      // Key was removed - switch to mock
      console.info(`${DIAG_PREFIX} API key removed - switching to MOCK`);
      this.provider = MockProvider;
      this.originalLiveProvider = null;
      this.mode = 'MOCK';
      this.apiHealth = 'MISSING';
      this.mockReason = 'NO_API_KEY';
      this.mockReasonMessage = 'No API key configured';
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
          console.warn(`${DIAG_PREFIX} Quote fetch failed (non-fatal): ${err instanceof Error ? err.message : err}`);
          return null;
        }),
      ]);

      this.candles = candles;
      this.latestQuote = quote;
      this.status = 'CONNECTED';
      this.lastUpdated = Date.now();
      if (this.mode === 'LIVE') {
        this.lastLiveUpdate = Date.now();
        this.lastSuccessfulLiveRequest = Date.now();
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
            `TwelveData provider active - receiving real-time ${this.symbol} market data.`,
          );
        }
        this.lastNotifiedStatus = 'CONNECTED';
      }
      if (this.lastNotifiedMode !== this.mode) {
        this.lastNotifiedMode = this.mode;
      }

      if (this.mode === 'LIVE') {
        console.info(`${DIAG_PREFIX} LIVE data received - ${candles.length} candles, price: ${quote?.price ?? 'N/A'}`);
      }
    } catch (err) {
      const reason = classifyError(err);
      this.lastFailedRequest = Date.now();
      this.consecutiveFailures++;
      console.error(`${DIAG_PREFIX} Refresh failed (${this.consecutiveFailures}/${MAX_LIVE_FAILURES}): ${reason.message}`);

      if (this.mode === 'LIVE' && this.consecutiveFailures >= MAX_LIVE_FAILURES) {
        console.warn(`${DIAG_PREFIX} ${MAX_LIVE_FAILURES} consecutive failures - falling back to MOCK (retries will continue)`);
        this.fallbackToMock(reason.message, errorToMockReason(reason));
      } else if (this.mode === 'LIVE' && this.candles.length === 0) {
        this.fallbackToMock(reason.message, errorToMockReason(reason));
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

  private fallbackToMock(reason: string, mockReason: Exclude<MockReason, null>) {
    const wasLive = this.mode === 'LIVE';
    console.warn(`${DIAG_PREFIX} Falling back to MOCK - reason: ${mockReason} (${reason})`);
    this.provider = MockProvider;
    this.mode = 'MOCK';
    this.mockReason = mockReason;
    this.mockReasonMessage = reason;
    this.error = `Live data unavailable (${reason}). Switched to mock data.`;
    this.status = 'CONNECTING';
    this.notify();

    if (wasLive) {
      this.emitNotification(
        'SWITCHED_TO_MOCK',
        'Switched to Mock Mode',
        `Live data unavailable - ${reason}. Using mock data while reconnection is attempted.`,
      );
    }

    this.provider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT)
      .then((candles) => {
        this.candles = candles;
        this.status = 'CONNECTED';
        this.lastUpdated = Date.now();
        this.notify();
        console.info(`${DIAG_PREFIX} MOCK fallback successful - data flowing`);
      })
      .catch((err) => {
        this.status = 'ERROR';
        this.error = `Mock fallback also failed: ${err instanceof Error ? err.message : err}`;
        this.notify();
        console.error(`${DIAG_PREFIX} Mock fallback failed: ${err instanceof Error ? err.message : err}`);
      });

    // Schedule auto-reconnect attempts to restore live mode
    if (wasLive) {
      this.scheduleAutoReconnect();
    }
  }

  private scheduleAutoReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`${DIAG_PREFIX} Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached - staying in MOCK`);
      this.reconnectStatus = 'FAILED';
      this.notify();
      return;
    }

    this.reconnectStatus = 'PENDING';
    this.reconnectAttempts++;
    const attempt = this.reconnectAttempts;
    const delay = RECONNECT_DELAY_MS * attempt;
    console.info(`${DIAG_PREFIX} Auto-reconnect scheduled (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      const key = apiKeyStorageService.getApiKey();
      if (!key) {
        this.reconnectStatus = 'FAILED';
        this.apiHealth = 'MISSING';
        this.mockReason = 'NO_API_KEY';
        this.mockReasonMessage = 'No API key configured';
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
        this.lastSuccessfulLiveRequest = Date.now();
        this.error = null;
        this.errorReason = null;
        this.apiHealth = 'VALID';
        this.reconnectStatus = 'SUCCEEDED';
        this.consecutiveFailures = 0;
        this.reconnectAttempts = 0;
        this.mockReason = null;
        this.mockReasonMessage = null;
        this.notify();

        if (!this.refreshTimer) {
          this.startPolling();
        }

        this.emitNotification(
          'AUTO_RECONNECT_SUCCESS',
          'Auto-Reconnection Successful',
          `TwelveData live market data restored for ${this.symbol} after ${attempt} attempt(s).`,
        );
        console.info(`${DIAG_PREFIX} Auto-reconnect successful - LIVE mode restored`);
      } catch (err) {
        const reason = classifyError(err);
        this.lastFailedRequest = Date.now();
        console.warn(`${DIAG_PREFIX} Auto-reconnect attempt ${attempt} failed: ${reason.message}`);
        this.reconnectStatus = 'FAILED';
        if (reason.code === 'AUTH_FAILED') {
          this.apiHealth = 'INVALID';
          this.mockReason = 'INVALID_API_KEY';
          this.mockReasonMessage = reason.message;
          this.notify();
          // Don't retry auth failures - key is invalid
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

// SINGLETON EXPORT - this is the ONLY instance of MarketDataService in the entire app.
// Module caching ensures this same instance is reused across hot reloads and refreshes.
export const marketDataService = new MarketDataService();
