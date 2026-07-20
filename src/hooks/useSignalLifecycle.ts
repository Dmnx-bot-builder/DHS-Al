// useSignalLifecycle — React hook wrapping SignalLifecycleManager

import { useEffect, useState } from 'react';
import { signalLifecycleManager } from '../services/signalLifecycleManager';
import type { LifecycleState } from '../services/signalLifecycleManager';

export function useSignalLifecycle(): LifecycleState {
  const [state, setState] = useState<LifecycleState>(() => signalLifecycleManager.getState());

  useEffect(() => {
    return signalLifecycleManager.subscribe(setState);
  }, []);

  return state;
}
