// useMarketCache - React hook for consuming MarketCacheService.
// Phase 9: Performance optimization - uses useSyncExternalStore for
// tear-free reads and automatic memoization.
// All consumers (Strategy Engine, Trade Reports, Dashboard, Notifications,
// Signal Lifecycle, Analytics) should use this hook instead of making API requests.

import { useSyncExternalStore, useCallback } from 'react';
import { marketCacheService } from '../services/marketCacheService';
import type { MarketSnapshot, OhlcCandle, LiveQuote, FreshnessState } from '../types';

function subscribe(listener: () => void): () => void {
  return marketCacheService.subscribe(() => listener());
}

function getSnapshot(): MarketSnapshot | null {
  return marketCacheService.getSnapshot();
}

function getCandles(): OhlcCandle[] {
  return marketCacheService.getCandles();
}

function getQuote(): LiveQuote | null {
  return marketCacheService.getQuote();
}

function getTimestamp(): number | null {
  return marketCacheService.getTimestamp();
}

function getFreshness(): FreshnessState {
  return marketCacheService.getFreshness();
}

export function useMarketCache(): MarketSnapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function useMarketCandles(): OhlcCandle[] {
  return useSyncExternalStore(subscribe, getCandles, () => []);
}

export function useMarketQuote(): LiveQuote | null {
  return useSyncExternalStore(subscribe, getQuote, () => null);
}

export function useCacheTimestamp(): number | null {
  return useSyncExternalStore(subscribe, getTimestamp, () => null);
}

export function useCacheFreshness(): FreshnessState {
  return useSyncExternalStore(subscribe, getFreshness, () => 'EXPIRED');
}

export function useCacheSubscriberCount(): number {
  useMarketCache();
  return marketCacheService.getSubscriberCount();
}

export function useMarketCacheActions() {
  const clear = useCallback(() => marketCacheService.clear(), []);
  return { clear };
}
