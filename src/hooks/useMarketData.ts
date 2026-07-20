// useMarketData — React hook wrapping marketDataService with subscription

import { useState, useEffect, useCallback } from 'react';
import { marketDataService } from '../services/marketDataService';
import type { MarketDataState, Timeframe } from '../types';

const IDLE_STATE: MarketDataState = {
  symbol: 'XAU/USD',
  timeframe: 'M15',
  candles: [],
  latestQuote: null,
  mode: 'MOCK',
  status: 'DISCONNECTED',
  provider: { name: 'mock', label: 'Mock Data', isLive: false },
  lastUpdated: null,
  lastLiveUpdate: null,
  error: null,
  errorReason: null,
  apiHealth: 'UNKNOWN',
  reconnectStatus: 'IDLE',
  autoRefreshEnabled: true,
  apiKeySource: 'none',
  maskedApiKey: null,
  consecutiveFailures: 0,
};

export function useMarketData(symbol: string = 'XAU/USD', timeframe: Timeframe = 'M15') {
  const [state, setState] = useState<MarketDataState>(IDLE_STATE);

  useEffect(() => {
    let mounted = true;
    setState((prev) => ({ ...prev, symbol, timeframe, status: 'CONNECTING' }));

    const unsubscribe = marketDataService.subscribe((next) => {
      if (mounted) setState(next);
    });

    marketDataService.start(symbol, timeframe);

    return () => {
      mounted = false;
      unsubscribe();
      marketDataService.stop();
    };
  }, [symbol, timeframe]);

  const setTimeframe = useCallback((tf: Timeframe) => marketDataService.setTimeframe(tf), []);
  const setSymbol = useCallback((sym: string) => marketDataService.setSymbol(sym), []);

  return { ...state, setTimeframe, setSymbol };
}
