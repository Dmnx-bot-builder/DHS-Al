// Trade execution service — order placement, position management

import { apiGet, apiPost, apiPut } from './apiClient';
import type {
  OpenPosition, ExecutionLogEntry, TradeSettings,
  ExecuteOrderRequest, ExecuteOrderResponse,
  ClosePositionRequest, CloseAllResponse, UpdateSettingsRequest,
} from '../types';

export const executionService = {
  getOpenPositions: () =>
    apiGet<OpenPosition[]>('/execution/positions'),

  getExecutionLog: (limit = 50) =>
    apiGet<ExecutionLogEntry[]>(`/execution/log?limit=${limit}`),

  getSettings: () =>
    apiGet<TradeSettings>('/execution/settings'),

  updateSettings: (data: UpdateSettingsRequest) =>
    apiPut<TradeSettings>('/execution/settings', data),

  executeOrder: (data: ExecuteOrderRequest) =>
    apiPost<ExecuteOrderResponse>('/execution/order', data),

  closePosition: (data: ClosePositionRequest) =>
    apiPost<ClosePositionResponse>('/execution/close', data),

  closeAll: () =>
    apiPost<CloseAllResponse>('/execution/close-all'),
};

// ClosePositionResponse is a simple inline type
interface ClosePositionResponse {
  ticket: number;
  pnl: number;
  message: string;
  closedAt: string;
}
