// useGlobalMarket — the ONE hook every component uses to read market state.
// Combines:
//   - Global active symbol/timeframe (from MarketStoreProvider)
//   - Live candles + quote (from MarketCacheService singleton)
//   - Live StrategyAnalysis (computed from candles via marketStructureService)
//
// Every component that needs market data should use this hook.
// Nothing should fetch independently or read from /data/strategy.ts.

import { useMemo } from 'react';
import { useGlobalSymbol, useGlobalTimeframe } from '../store/marketStore';
import { useMarketCache, useMarketCandles, useMarketQuote } from './useMarketCache';
import { computeStrategyAnalysis } from '../services/marketStructureService';
import type { StrategyAnalysis } from '../data/strategy';

export function useGlobalMarket() {
  const symbol = useGlobalSymbol();
  const timeframe = useGlobalTimeframe();
  const snapshot = useMarketCache();
  const candles = useMarketCandles();
  const quote = useMarketQuote();

  const currentPrice = quote?.price ?? (candles.length > 0 ? candles[candles.length - 1].close : 0);

  const analysis: StrategyAnalysis = useMemo(
    () => computeStrategyAnalysis(candles, symbol, timeframe, currentPrice),
    [candles, symbol, timeframe, currentPrice],
  );

  return {
    symbol,
    timeframe,
    snapshot,
    candles,
    quote,
    currentPrice,
    analysis,
  };
}