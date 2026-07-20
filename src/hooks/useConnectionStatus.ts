// useConnectionStatus - React hook wrapping marketDataService with
// connection management actions (reconnect, test, setAutoRefresh).
// Uses the real service state as initial value instead of a MOCK default.

import { useState, useEffect, useCallback } from 'react';
import { marketDataService } from '../services/marketDataService';
import type { MarketDataState } from '../types';

export function useConnectionStatus() {
  const [state, setState] = useState<MarketDataState>(() => marketDataService.getState());

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
