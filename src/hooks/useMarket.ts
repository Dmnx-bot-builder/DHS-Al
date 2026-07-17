// Market data hook — wraps marketService for React components

import { useApi } from './useApi';
import { marketService } from '../services/marketService';
import type { CandleRequest } from '../types';

export function useMarketQuote(symbol: string, refetchInterval = 5000) {
  return useApi(() => marketService.getQuote(symbol), [symbol], { refetchInterval });
}

export function useWatchlist() {
  return useApi(() => marketService.getWatchlist(), []);
}

export function useCandles(params: CandleRequest) {
  return useApi(() => marketService.getCandles(params), [params.symbol, params.timeframe, params.from, params.to, params.limit]);
}

export function useMarketNews() {
  return useApi(() => marketService.getNews(), []);
}

export function useMarketStatus() {
  return useApi(() => marketService.getMarketStatus(), []);
}
