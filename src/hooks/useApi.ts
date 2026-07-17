// Generic data-fetching hook with loading/error/refetch state

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiError } from '../types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseApiOptions = {},
): UseApiState<T> & { refetch: () => void } {
  const { enabled = true, refetchInterval } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      if (mountedRef.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: err as ApiError });
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) execute();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, enabled]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const id = setInterval(execute, refetchInterval);
    return () => clearInterval(id);
  }, [refetchInterval, enabled, execute]);

  return { ...state, refetch: execute };
}
