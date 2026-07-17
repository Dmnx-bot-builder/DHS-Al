// Generic mutation hook for POST/PUT/DELETE operations

import { useState, useCallback } from 'react';
import type { ApiError } from '../types';

interface UseMutationState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
}

export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
): UseMutationState<T> & {
  mutate: (variables: V) => Promise<T>;
  reset: () => void;
} {
  const [state, setState] = useState<UseMutationState<T>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false,
  });

  const mutate = useCallback(async (variables: V): Promise<T> => {
    setState({ data: null, loading: true, error: null, isSuccess: false });
    try {
      const data = await mutationFn(variables);
      setState({ data, loading: false, error: null, isSuccess: true });
      return data;
    } catch (err) {
      setState({ data: null, loading: false, error: err as ApiError, isSuccess: false });
      throw err;
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, isSuccess: false });
  }, []);

  return { ...state, mutate, reset };
}
