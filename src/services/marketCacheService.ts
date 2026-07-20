// MarketCacheService - Singleton shared market cache.
// Receives every successful live update from MarketDataService.
// Stores the latest market snapshot, timestamp, provider, and freshness state.
// Publishes updates to all subscribers.
// Every feature must consume cached data instead of making new API requests.
//
// SINGLETON INVARIANT: This module exports exactly one `marketCacheService` instance.
// No other code should create a new MarketCacheService.

import type {
  MarketSnapshot,
  OhlcCandle,
  LiveQuote,
  ProviderInfo,
  Timeframe,
  MarketDataMode,
  FreshnessState,
} from '../types';

type CacheListener = (snapshot: MarketSnapshot) => void;

const CACHE_STORAGE_KEY = 'dhs-ai-market-cache';
const FRESH_THRESHOLD_MS = 30_000;
const STALE_THRESHOLD_MS = 120_000;

function computeFreshness(timestamp: number, now: number): FreshnessState {
  const age = now - timestamp;
  if (age <= FRESH_THRESHOLD_MS) return 'FRESH';
  if (age <= STALE_THRESHOLD_MS) return 'STALE';
  return 'EXPIRED';
}

function loadFromStorage(): MarketSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketSnapshot;
    if (
      parsed &&
      typeof parsed.symbol === 'string' &&
      typeof parsed.timestamp === 'number' &&
      Array.isArray(parsed.candles)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(snapshot: MarketSnapshot): void {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage full or unavailable
  }
}

class MarketCacheService {
  private snapshot: MarketSnapshot | null = null;
  private listeners = new Set<CacheListener>();

  constructor() {
    this.snapshot = loadFromStorage();
    if (this.snapshot) {
      console.info(`[MarketCache] Restored cached snapshot for ${this.snapshot.symbol} (${this.snapshot.timeframe})`);
    }
  }

  /**
   * Publishes a new market snapshot to the cache.
   * Called by MarketDataService after every successful live update.
   */
  publish(params: {
    symbol: string;
    timeframe: Timeframe;
    candles: OhlcCandle[];
    latestQuote: LiveQuote | null;
    provider: ProviderInfo;
    mode: MarketDataMode;
  }): void {
    const now = Date.now();
    this.snapshot = {
      symbol: params.symbol,
      timeframe: params.timeframe,
      candles: params.candles,
      latestQuote: params.latestQuote,
      provider: params.provider,
      mode: params.mode,
      timestamp: now,
      freshness: 'FRESH',
    };
    saveToStorage(this.snapshot);
    this.notify();
  }

  /**
   * Returns the current cached snapshot, or null if no data has been cached.
   */
  getSnapshot(): MarketSnapshot | null {
    if (!this.snapshot) return null;
    const now = Date.now();
    return {
      ...this.snapshot,
      freshness: computeFreshness(this.snapshot.timestamp, now),
    };
  }

  /**
   * Returns the cached candles, or empty array if no cache.
   */
  getCandles(): OhlcCandle[] {
    return this.snapshot?.candles ?? [];
  }

  /**
   * Returns the cached latest quote, or null if no cache.
   */
  getQuote(): LiveQuote | null {
    return this.snapshot?.latestQuote ?? null;
  }

  /**
   * Returns the timestamp of the last cached update.
   */
  getTimestamp(): number | null {
    return this.snapshot?.timestamp ?? null;
  }

  /**
   * Returns the freshness state of the cache.
   */
  getFreshness(): FreshnessState {
    if (!this.snapshot) return 'EXPIRED';
    return computeFreshness(this.snapshot.timestamp, Date.now());
  }

  /**
   * Returns the number of active subscribers.
   */
  getSubscriberCount(): number {
    return this.listeners.size;
  }

  /**
   * Subscribes to cache updates. The listener is immediately called with the current snapshot.
   */
  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    if (this.snapshot) {
      listener(this.getSnapshot()!);
    }
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    if (!this.snapshot) return;
    const snapshot = this.getSnapshot()!;
    this.listeners.forEach((l) => l(snapshot));
  }

  /**
   * Clears the cache. Used when the user removes the API key.
   */
  clear(): void {
    this.snapshot = null;
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {
      // ignore
    }
    this.listeners.forEach((l) => {
      l({
        symbol: '',
        timeframe: 'M15',
        candles: [],
        latestQuote: null,
        provider: { name: 'mock', label: 'Mock Data', isLive: false },
        mode: 'MOCK',
        timestamp: 0,
        freshness: 'EXPIRED',
      });
    });
  }
}

// SINGLETON EXPORT - this is the ONLY instance of MarketCacheService in the entire app.
export const marketCacheService = new MarketCacheService();
