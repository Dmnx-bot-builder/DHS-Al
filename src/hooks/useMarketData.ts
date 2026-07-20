// useMarketData - React hook wrapping marketDataService with subscription.
// IMPORTANT: This hook must NOT call marketDataService.stop() on unmount.
// The singleton service must persist across page navigation, hot reloads,
// and component unmount/remount cycles. Only the subscription is cleaned up.

import { useState, useEffect, useCallback } from 'react';
import { marketDataService } from '../services/marketDataService';
import type { MarketDataState, Timeframe } from '../types';

export function useMarketData(symbol: string = 'XAU/USD', timeframe: Timeframe = 'M15') {
  const [state, setState] = useState<MarketDataState>(() => marketDataService.getState());

  useEffect(() => {
    let mounted = true;

    const unsubscribe = marketDataService.subscribe((next) => {
      if (mounted) setState(next);
    });

    marketDataService.start(symbol, timeframe);

    return () => {
      mounted = false;
      unsubscribe();
      // Do NOT call marketDataService.stop() here.
      // The singleton must survive unmount to preserve LIVE mode across navigation.
    };
  }, [symbol, timeframe]);

  const setTimeframe = useCallback((tf: Timeframe) => marketDataService.setTimeframe(tf), []);
  const setSymbol = useCallback((sym: string) => marketDataService.setSymbol(sym), []);

  return { ...state, setTimeframe, setSymbol };
}
