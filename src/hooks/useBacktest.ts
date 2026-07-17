// Backtest hook — wraps backtestService for React components

import { useState } from 'react';
import { useMutation } from './useMutation';
import { useApi } from './useApi';
import { backtestService } from '../services/backtestService';
import type { RunBacktestRequest, BacktestResultPayload } from '../types';

export function useRunBacktest() {
  const [result, setResult] = useState<BacktestResultPayload | null>(null);
  const mutation = useMutation((data: RunBacktestRequest) => backtestService.runBacktest(data));

  const run = async (data: RunBacktestRequest) => {
    const res = await mutation.mutate(data);
    setResult(res);
    return res;
  };

  return { ...mutation, result, run };
}

export function useBacktestHistory(limit = 10) {
  return useApi(() => backtestService.getBacktestHistory(limit), [limit]);
}

export function useBacktestStrategies() {
  return useApi(() => backtestService.getStrategies(), []);
}

export function useBacktestSymbols() {
  return useApi(() => backtestService.getSymbols(), []);
}
