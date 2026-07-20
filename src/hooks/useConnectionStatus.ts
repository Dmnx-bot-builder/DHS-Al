// useConnectionStatus — React hook wrapping marketDataService with
// connection management actions (reconnect, test, setAutoRefresh).

import { useState, useEffect, useCallback } from 'react';
import { marketDataService } from '../services/marketDataService';
import type { MarketDataState } from '../types';

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

export function useConnectionStatus() {
  const [state, setState] = useState<MarketDataState>(IDLE_STATE);

  useEffect(() => {
    const unsubscribe = marketDataService.subscribe((next) => {
      setState(next);
    });
    return unsubscribe;
  }, []);

  const reconnect = useCallback(() => marketDataService.reconnect(), []);
  const testConnection = useCallback(() => marketDataService.testConnection(), []);
  const setAutoRefresh = useCallback((enabled: boolean) => marketDataService.setAutoRefresh(enabled), []);

  return {
    ...state,
    reconnect,
    testConnection,
    setAutoRefresh,
  };
}
