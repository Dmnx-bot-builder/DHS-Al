// Trade signal service — AI strategy analysis and signals

import { apiGet } from './apiClient';
import type { TradeSignal, SignalRequest } from '../types';

export const signalService = {
  getSignal: (params: SignalRequest) => {
    const query = new URLSearchParams({ symbol: params.symbol });
    if (params.timeframe) query.set('timeframe', params.timeframe);
    return apiGet<TradeSignal>(`/signals/current?${query}`);
  },

  getSignalHistory: (symbol: string, limit = 20) =>
    apiGet<TradeSignal[]>(`/signals/history?symbol=${symbol}&limit=${limit}`),

  getLatestSignal: (symbol: string) =>
    apiGet<TradeSignal>(`/signals/latest?symbol=${symbol}`),
};
