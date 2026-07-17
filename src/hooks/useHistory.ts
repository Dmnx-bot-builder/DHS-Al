// History hook — wraps historyService for React components

import { useApi } from './useApi';
import { historyService } from '../services/historyService';
import type { HistoryQueryParams } from '../types';

export function useHistoryTrades(params?: HistoryQueryParams) {
  const key = JSON.stringify(params);
  return useApi(() => historyService.getTrades(params), [key]);
}

export function useHistoryStats(params?: Parameters<typeof historyService.getStats>[0]) {
  const key = JSON.stringify(params);
  return useApi(() => historyService.getStats(params), [key]);
}

export function useMonthlyPnl(params?: { startDate?: string; endDate?: string }) {
  const key = JSON.stringify(params);
  return useApi(() => historyService.getMonthlyPnl(params), [key]);
}

export function useStrategyStats() {
  return useApi(() => historyService.getStrategyStats(), []);
}
