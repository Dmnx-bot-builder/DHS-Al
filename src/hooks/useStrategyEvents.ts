// useStrategyEvents — React hook wrapping StrategyEventManager

import { useEffect, useState } from 'react';
import { strategyEventManager } from '../services/strategyEventManager';
import type { StrategyEventState } from '../services/strategyEventManager';

export function useStrategyEvents(): StrategyEventState {
  const [state, setState] = useState<StrategyEventState>(() => strategyEventManager.getState());

  useEffect(() => {
    return strategyEventManager.subscribe(setState);
  }, []);

  return state;
}
