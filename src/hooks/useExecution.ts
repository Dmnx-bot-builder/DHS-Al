// Execution hook — wraps executionService for React components

import { useApi } from './useApi';
import { useMutation } from './useMutation';
import { executionService } from '../services/executionService';
import type { ExecuteOrderRequest, ClosePositionRequest, UpdateSettingsRequest } from '../types';

export function useOpenPositions(refetchInterval = 3000) {
  return useApi(() => executionService.getOpenPositions(), [], { refetchInterval });
}

export function useExecutionLog(limit = 50) {
  return useApi(() => executionService.getExecutionLog(limit), [limit]);
}

export function useExecutionSettings() {
  return useApi(() => executionService.getSettings(), []);
}

export function useExecuteOrder() {
  return useMutation((data: ExecuteOrderRequest) => executionService.executeOrder(data));
}

export function useClosePosition() {
  return useMutation((data: ClosePositionRequest) => executionService.closePosition(data));
}

export function useCloseAll() {
  return useMutation(() => executionService.closeAll());
}

export function useUpdateExecutionSettings() {
  return useMutation((data: UpdateSettingsRequest) => executionService.updateSettings(data));
}
