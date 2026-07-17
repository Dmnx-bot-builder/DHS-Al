// Backtesting service — run backtests, retrieve results

import { apiPost, apiGet } from './apiClient';
import type { RunBacktestRequest, BacktestResultPayload } from '../types';

export const backtestService = {
  runBacktest: (data: RunBacktestRequest) =>
    apiPost<BacktestResultPayload>('/backtest/run', data),

  getBacktestById: (id: string) =>
    apiGet<BacktestResultPayload>(`/backtest/${id}`),

  getBacktestHistory: (limit = 10) =>
    apiGet<BacktestResultPayload[]>(`/backtest/history?limit=${limit}`),

  getStrategies: () =>
    apiGet<string[]>('/backtest/strategies'),

  getSymbols: () =>
    apiGet<string[]>('/backtest/symbols'),
};
