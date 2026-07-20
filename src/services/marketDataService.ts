// Market Data Service - orchestrates providers, auto-refresh, and fallback to mock.
// Integrates ApiKeyStorageService for persistent credentials and emits
// real event-driven notifications through NotificationService.
//
// ARCHITECTURE:
//   MarketDataService is the ONLY service that talks to TwelveData.
//   Every successful update is published to MarketCacheService.
//   All consumers (Strategy Engine, Trade Reports, Dashboard, Notifications,
//   Signal Lifecycle, Analytics) read from MarketCacheService - never from
//   the provider directly.
//
// SINGLETON INVARIANT: This module exports exactly one `marketDataService` instance.
// No other code should create a new MarketDataService. Hot reloads, page refreshes,
// and Bolt preview restarts all reuse this same instance via module caching.
//
// STARTUP SEQUENCE:
//   1. Load API key from localStorage (or env fallback)
//   2. Validate API key format
//   3. Initialize TwelveDataProvider
//   4. Restore MarketCache from localStorage
//   5. Test connection (fetch candles + quote)
//   6. If successful: Provider = TwelveData, Mode = LIVE, API Health = VALID, begin polling
//   7. If rate limited: Enter SNAPSHOT mode, keep last live prices visible
//   8. If failed: Display exact failure reason, retry automatically, only enable MOCK after all retries fail

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
  TwelveDataPlan,
  RateLimitInfo,
  ApiUsageInfo,
  DebugInfo,
} from '../types';
import { MockProvider, createTwelveDataProvider } from './providers';
import { apiKeyStorageService } from './apiKeyStorageService';
import { notificationService } from './notificationService';
import { marketCacheService } from './marketCacheService';
import { rateLimitManager } from './rateLimitManager';
import { planService } from './planService';

type Listener = (state: MarketDataState) => void;

const DEFAULT_SYMBOL = 'XAU/USD';
const DEFAULT_TIMEFRAME: Timeframe = 'M15';
const DEFAULT_LIMIT = 200;
const MAX_LIVE_FAILURES = 3;
const RECONNECT_DELAY_MS = 5_000;
const MAX_RECONNECT_ATTEMPTS = 5;
const OFFLINE_CHECK_INTERVAL_MS = 10_000;

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
  private lastRequestDurationMs: number | null = null;
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
  private offlineTimer: ReturnType<typeof setInterval> | null = null;
  private isFetching = false;
  private originalLiveProvider: MarketDataProvider | null = null;
  private started = false;
  private lastNotifiedMode: MarketDataMode | null = null;
  private lastNotifiedStatus: ConnectionStatus | null = null;
  private isOnline: boolean = navigator.onLine;
  private requestsSent = 0;

  constructor() {
    console.info(`${DIAG_PREFIX} === Singleton MarketDataService instantiated ===`);

    // Step 1: Load API key from localStorage
    const storedKey = apiKeyStorageService.getApiKey();
    const source = apiKeyStorageService.getSource();

    if (storedKey && storedKey.trim().length > 0) {
      console.info(`${DIAG_PREFIX} [1/7] API key loaded from ${source} (key: ${storedKey.slice(0, 8)}...${storedKey.slice(-4)})`);
      this.provider = createTwelveDataProvider(storedKey);
      this.mode = 'LIVE';
      this.apiKeySource = source;
      this.maskedApiKey = apiKeyStorageService.getMaskedKey();
      this.originalLiveProvider = this.provider;
      console.info(`${DIAG_PREFIX} [2/7] API key validated (length: ${storedKey.length})`);
      console.info(`${DIAG_PREFIX} [3/7] TwelveData provider created`);
    } else {
      console.info(`${DIAG_PREFIX} [1/7] No API key found - initializing MOCK mode`);
      this.provider = MockProvider;
      this.mode = 'MOCK';
      this.apiKeySource = 'none';
      this.apiHealth = 'MISSING';
      this.mockReason = 'NO_API_KEY';
      this.mockReasonMessage = 'No API key configured in Settings or .env';
    }

    // Step 4: Restore MarketCache from localStorage
    const cached = marketCacheService.getSnapshot();
    if (cached && cached.candles.length > 0) {
      this.candles = cached.candles;
      this.latestQuote = cached.latestQuote;
      console.info(`${DIAG_PREFIX} [4/7] MarketCache restored - ${cached.candles.length} candles for ${cached.symbol}`);
    } else {
      console.info(`${DIAG_PREFIX} [4/7] No cached market data found`);
    }

    // Subscribe to API key storage changes
    apiKeyStorageService.subscribe(() => {
      this.handleApiKeyChange();
    });

    // Subscribe to plan changes for adaptive polling
    planService.subscribe(() => {
      if (this.started) {
        console.info(`${DIAG_PREFIX} Plan changed - restarting polling with new interval`);
        this.startPolling();
      }
    });

    // Subscribe to rate limit manager
    rateLimitManager.subscribe(() => {
      this.notify();
    });
    rateLimitManager.onResume(() => {
      console.info(`${DIAG_PREFIX} Rate limit cooldown expired - resuming polling`);
      this.consecutiveFailures = 0;
      this.startPolling();
    });

    // Online/offline detection (Phase 8)
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    this.startOfflineCheck();
  }

  getProviderInfo(): ProviderInfo {
    return { name: this.provider.name, label: this.provider.label, isLive: this.provider.isLive };
  }

  private getPlan(): TwelveDataPlan {
    return planService.getPlan();
  }

  private getPollingIntervalMs(): number {
    return planService.getPollingInterval();
  }

  private getRateLimitInfo(): RateLimitInfo {
    return rateLimitManager.getInfo();
  }

  private getApiUsageInfo(): ApiUsageInfo {
    const rateLimit = this.getRateLimitInfo();
    const plan = this.getPlan();
    const limit = planService.getRequestLimit();
    const remaining = limit > 0 ? Math.max(0, limit - this.requestsSent) : null;
    return {
      provider: this.getProviderInfo(),
      plan,
      pollingIntervalMs: this.getPollingIntervalMs(),
      apiStatus: this.apiHealth,
      requestsSent: this.requestsSent,
      estimatedRequestsRemaining: remaining,
      lastSuccessfulRequest: this.lastSuccessfulLiveRequest,
      lastFailedRequest: this.lastFailedRequest,
      quotaState: rateLimit.state,
      countdownUntilRetry: rateLimit.countdownSeconds,
    };
  }

  private getDebugInfo(): DebugInfo {
    const rateLimit = this.getRateLimitInfo();
    const cacheAge = marketCacheService.getTimestamp()
      ? Date.now() - marketCacheService.getTimestamp()!
      : null;
    return {
      provider: this.getProviderInfo(),
      connectionState: this.status,
      pollingStatus: this.pollingStatus,
      pollingIntervalMs: this.getPollingIntervalMs(),
      cacheAgeMs: cacheAge,
      lastRequestDurationMs: this.lastRequestDurationMs,
      rateLimitState: rateLimit.state,
      retryCountdownSeconds: rateLimit.countdownSeconds,
      cacheSubscribers: marketCacheService.getSubscriberCount(),
      currentSymbol: this.symbol,
      lastError: this.error,
    };
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
      plan: this.getPlan(),
      pollingIntervalMs: this.getPollingIntervalMs(),
      rateLimit: this.getRateLimitInfo(),
      apiUsage: this.getApiUsageInfo(),
      debug: this.getDebugInfo(),
      cacheSubscribers: marketCacheService.getSubscriberCount(),
      lastRequestDurationMs: this.lastRequestDurationMs,
      isOnline: this.isOnline,
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
    console.info(`${DIAG_PREFIX} Symbol: ${symbol}, Timeframe: ${timeframe}, Mode: ${this.mode}, Plan: ${this.getPlan()}`);

    if (this.mode === 'LIVE') {
      // Step 5-6: Test connection before declaring LIVE
      await this.testAndStartLive();
    } else {
      // No API key - start mock polling
      console.info(`${DIAG_PREFIX} [5/7] Skipped (no API key) - starting MOCK polling`);
      await this.refresh();
      this.startPolling();
      console.info(`${DIAG_PREFIX} [7/7] MOCK polling started`);
    }
  }

  /**
   * Tests the live connection and starts polling if successful.
   * If the test fails, retries up to MAX_RECONNECT_ATTEMPTS before falling back to mock.
   * If rate limited, enters SNAPSHOT mode (Phase 4).
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

    // Check rate limit before testing
    if (rateLimitManager.isLimited()) {
      console.info(`${DIAG_PREFIX} [5/7] Rate limit active - entering SNAPSHOT mode`);
      this.enterSnapshotMode('Rate limit cooldown active');
      return;
    }

    // Check offline status
    if (!this.isOnline) {
      console.info(`${DIAG_PREFIX} [5/7] Offline - entering SNAPSHOT mode`);
      this.enterSnapshotMode('Network offline');
      return;
    }

    this.status = 'CONNECTING';
    this.notify();
    console.info(`${DIAG_PREFIX} [5/7] Testing TwelveData connection...`);

    try {
      const requestStart = Date.now();
      const [candles, quote] = await Promise.all([
        this.provider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        this.provider.fetchQuote(this.symbol).catch(() => null),
      ]);
      this.lastRequestDurationMs = Date.now() - requestStart;
      this.requestsSent += 2;

      // Step 6: Connection successful
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
      rateLimitManager.reset();
      console.info(`${DIAG_PREFIX} [6/7] Connection test successful - ${candles.length} candles received`);

      // Publish to cache (Phase 1)
      marketCacheService.publish({
        symbol: this.symbol,
        timeframe: this.timeframe,
        candles,
        latestQuote: quote,
        provider: this.getProviderInfo(),
        mode: this.mode,
      });
      console.info(`${DIAG_PREFIX} [7/7] Cache published - LIVE polling started`);
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
      console.error(`${DIAG_PREFIX} [6/7] Connection test FAILED: ${reason.message}`);

      // Phase 3: If rate limited, trigger rate limit manager and enter snapshot
      if (reason.code === 'RATE_LIMIT_REACHED') {
        rateLimitManager.triggerRateLimit(reason.message);
        this.apiHealth = 'RATE_LIMITED';
        this.enterSnapshotMode(reason.message);
        return;
      }

      this.notify();
      // Start retry sequence - do NOT immediately fall back to mock
      this.scheduleAutoReconnect();
    }
  }

  private startPolling() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    const intervalMs = this.getPollingIntervalMs();
    this.pollingStatus = this.autoRefreshEnabled ? 'ACTIVE' : 'PAUSED';
    this.refreshTimer = setInterval(() => {
      if (this.autoRefreshEnabled) this.refresh();
    }, intervalMs);
    console.info(`${DIAG_PREFIX} Auto-refresh enabled - every ${intervalMs / 1000}s (plan: ${this.getPlan()})`);
    this.notify();
  }

  /**
   * Phase 4: Enters SNAPSHOT mode - keeps last successful live prices visible.
   * Does NOT switch to MOCK mode. Only used when rate limited or temporarily offline.
   */
  private enterSnapshotMode(reason: string) {
    console.info(`${DIAG_PREFIX} Entering SNAPSHOT mode - ${reason}`);
    this.mode = 'SNAPSHOT';
    this.status = this.candles.length > 0 ? 'CONNECTED' : 'CONNECTING';
    this.error = `Live data paused - ${reason}. Showing last successful live prices.`;
    this.notify();

    // Stop polling while in snapshot mode
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.pollingStatus = 'PAUSED';

    this.emitNotification(
      'SWITCHED_TO_MOCK',
      'Live Snapshot Mode',
      `Live polling paused - ${reason}. Last successful prices are still displayed.`,
    );
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
   * Phase 2: Sets the TwelveData plan. Automatically adjusts polling interval.
   */
  setPlan(plan: TwelveDataPlan) {
    planService.setPlan(plan);
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
      const testProvider = createTwelveDataProvider(key);
      const requestStart = Date.now();
      const [candles, quote] = await Promise.all([
        testProvider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        testProvider.fetchQuote(this.symbol).catch(() => null),
      ]);
      this.lastRequestDurationMs = Date.now() - requestStart;
      this.requestsSent += 2;

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
      rateLimitManager.reset();

      marketCacheService.publish({
        symbol: this.symbol,
        timeframe: this.timeframe,
        candles,
        latestQuote: quote,
        provider: this.getProviderInfo(),
        mode: this.mode,
      });

      this.notify();
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
      this.requestsSent++;
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
        this.requestsSent += 2;

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
        rateLimitManager.reset();

        marketCacheService.publish({
          symbol: this.symbol,
          timeframe: this.timeframe,
          candles,
          latestQuote: quote,
          provider: this.getProviderInfo(),
          mode: this.mode,
        });

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

        if (reason.code === 'RATE_LIMIT_REACHED') {
          rateLimitManager.triggerRateLimit(reason.message);
          this.enterSnapshotMode(reason.message);
        } else {
          this.fallbackToMock(reason.message, errorToMockReason(reason));
        }
      }
    } else {
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
      marketCacheService.clear();
      this.notify();

      if (this.started) {
        await this.refresh();
      }
    }
  }

  /**
   * Phase 6: Request deduplication - only ONE market request may exist at any time.
   * If polling is already running, ignore duplicate requests.
   */
  private async refresh() {
    if (this.isFetching) {
      console.info(`${DIAG_PREFIX} Request dedup - already fetching, skipping duplicate request`);
      return;
    }
    if (rateLimitManager.isLimited()) {
      console.info(`${DIAG_PREFIX} Rate limit active - skipping refresh, staying in SNAPSHOT mode`);
      return;
    }
    if (!this.isOnline) {
      console.info(`${DIAG_PREFIX} Offline - skipping refresh, staying in SNAPSHOT mode`);
      return;
    }

    this.isFetching = true;

    try {
      const requestStart = Date.now();
      const [candles, quote] = await Promise.all([
        this.provider.fetchCandles(this.symbol, this.timeframe, DEFAULT_LIMIT),
        this.provider.fetchQuote(this.symbol).catch((err) => {
          console.warn(`${DIAG_PREFIX} Quote fetch failed (non-fatal): ${err instanceof Error ? err.message : err}`);
          return null;
        }),
      ]);
      this.lastRequestDurationMs = Date.now() - requestStart;
      this.requestsSent += 2;

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
      rateLimitManager.reset();

      // Phase 1: Publish to cache
      marketCacheService.publish({
        symbol: this.symbol,
        timeframe: this.timeframe,
        candles,
        latestQuote: quote,
        provider: this.getProviderInfo(),
        mode: this.mode,
      });

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

      // Phase 3: Rate limit handling
      if (reason.code === 'RATE_LIMIT_REACHED') {
        rateLimitManager.triggerRateLimit(reason.message);
        this.apiHealth = 'RATE_LIMITED';
        // Phase 4: Enter snapshot mode, do NOT fall back to mock
        this.enterSnapshotMode(reason.message);
        return;
      }

      if (this.mode === 'LIVE' && this.consecutiveFailures >= MAX_LIVE_FAILURES) {
        // If we have cached data, enter snapshot mode instead of mock
        if (this.candles.length > 0) {
          console.warn(`${DIAG_PREFIX} ${MAX_LIVE_FAILURES} consecutive failures - entering SNAPSHOT mode (retries will continue)`);
          this.enterSnapshotMode(reason.message);
        } else {
          console.warn(`${DIAG_PREFIX} ${MAX_LIVE_FAILURES} consecutive failures - falling back to MOCK (retries will continue)`);
          this.fallbackToMock(reason.message, errorToMockReason(reason));
        }
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
        marketCacheService.publish({
          symbol: this.symbol,
          timeframe: this.timeframe,
          candles,
          latestQuote: this.latestQuote,
          provider: this.getProviderInfo(),
          mode: this.mode,
        });
        this.notify();
        console.info(`${DIAG_PREFIX} MOCK fallback successful - data flowing`);
      })
      .catch((err) => {
        this.status = 'ERROR';
        this.error = `Mock fallback also failed: ${err instanceof Error ? err.message : err}`;
        this.notify();
        console.error(`${DIAG_PREFIX} Mock fallback failed: ${err instanceof Error ? err.message : err}`);
      });

    if (wasLive) {
      this.scheduleAutoReconnect();
    }
  }

  private scheduleAutoReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`${DIAG_PREFIX} Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached - staying in current mode`);
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
      if (!this.isOnline) {
        console.info(`${DIAG_PREFIX} Auto-reconnect skipped - still offline`);
        this.reconnectStatus = 'IDLE';
        this.notify();
        return;
      }
      if (rateLimitManager.isLimited()) {
        console.info(`${DIAG_PREFIX} Auto-reconnect skipped - rate limit cooldown active`);
        this.reconnectStatus = 'IDLE';
        this.notify();
        return;
      }

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
        this.requestsSent += 2;

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
        rateLimitManager.reset();

        marketCacheService.publish({
          symbol: this.symbol,
          timeframe: this.timeframe,
          candles,
          latestQuote: quote,
          provider: this.getProviderInfo(),
          mode: this.mode,
        });

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
          return;
        }
        if (reason.code === 'RATE_LIMIT_REACHED') {
          rateLimitManager.triggerRateLimit(reason.message);
          this.apiHealth = 'RATE_LIMITED';
          this.enterSnapshotMode(reason.message);
          return;
        }
        this.scheduleAutoReconnect();
      }
    }, delay);
  }

  // Phase 8: Offline mode
  private handleOnline() {
    console.info(`${DIAG_PREFIX} Network restored - resuming polling`);
    this.isOnline = true;
    this.status = this.candles.length > 0 ? 'CONNECTED' : 'CONNECTING';
    this.notify();
    if (this.started && this.mode === 'LIVE' && !this.refreshTimer) {
      this.startPolling();
    }
  }

  private handleOffline() {
    console.info(`${DIAG_PREFIX} Network lost - entering OFFLINE mode`);
    this.isOnline = false;
    this.status = 'OFFLINE';
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.pollingStatus = 'PAUSED';
    this.notify();

    if (this.candles.length > 0) {
      this.enterSnapshotMode('Network offline');
    }
  }

  private startOfflineCheck() {
    if (this.offlineTimer) clearInterval(this.offlineTimer);
    this.offlineTimer = setInterval(() => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      if (wasOnline && !this.isOnline) {
        this.handleOffline();
      } else if (!wasOnline && this.isOnline) {
        this.handleOnline();
      }
    }, OFFLINE_CHECK_INTERVAL_MS);
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
