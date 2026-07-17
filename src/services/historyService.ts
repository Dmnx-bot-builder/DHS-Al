// Trade history service — closed trades, stats, analytics

import { apiGet } from './apiClient';
import type { HistoryTrade, HistoryStats, HistoryQueryParams, MonthlyPnl, StrategyStat } from '../types';

function buildQuery(params: HistoryQueryParams): string {
  const q = new URLSearchParams();
  if (params.symbol) q.set('symbol', params.symbol);
  if (params.side) q.set('side', params.side);
  if (params.result) q.set('result', params.result);
  if (params.strategy) q.set('strategy', params.strategy);
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  if (params.search) q.set('search', params.search);
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortOrder) q.set('sortOrder', params.sortOrder);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return q.toString();
}

export const historyService = {
  getTrades: (params?: HistoryQueryParams) =>
    apiGet<HistoryTrade[]>(`/history/trades${params ? `?${buildQuery(params)}` : ''}`),

  getStats: (params?: Omit<HistoryQueryParams, 'page' | 'pageSize' | 'sortBy' | 'sortOrder' | 'search'>) =>
    apiGet<HistoryStats>(`/history/stats${params ? `?${buildQuery(params)}` : ''}`),

  getMonthlyPnl: (params?: { startDate?: string; endDate?: string }) =>
    apiGet<MonthlyPnl[]>(`/history/monthly-pnl${params ? `?${buildQuery(params)}` : ''}`),

  getStrategyStats: () =>
    apiGet<StrategyStat[]>('/history/strategy-stats'),

  exportCsv: (params?: HistoryQueryParams) =>
    apiGet<Blob>(`/history/export${params ? `?${buildQuery(params)}` : ''}`, { responseType: 'blob' }),
};
