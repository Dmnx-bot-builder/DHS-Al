// Signal hook — wraps signalService for React components

import { useApi } from './useApi';
import { signalService } from '../services/signalService';
import type { SignalRequest } from '../types';

export function useTradeSignal(params: SignalRequest, refetchInterval = 10000) {
  return useApi(() => signalService.getSignal(params), [params.symbol, params.timeframe], { refetchInterval });
}

export function useSignalHistory(symbol: string, limit = 20) {
  return useApi(() => signalService.getSignalHistory(symbol, limit), [symbol, limit]);
}

export function useLatestSignal(symbol: string) {
  return useApi(() => signalService.getLatestSignal(symbol), [symbol]);
}
