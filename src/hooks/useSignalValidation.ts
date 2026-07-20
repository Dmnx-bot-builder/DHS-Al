// useSignalValidation — React hook wrapping SignalValidationService

import { useEffect, useState } from 'react';
import { signalValidationService } from '../services/signalValidationService';
import type { ValidationState } from '../services/signalValidationService';

export function useSignalValidation(): ValidationState {
  const [state, setState] = useState<ValidationState>(() => signalValidationService.getState());

  useEffect(() => {
    return signalValidationService.subscribe(setState);
  }, []);

  return state;
}
