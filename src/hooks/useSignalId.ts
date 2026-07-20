// useSignalId — React hook wrapping SignalIdService

import { useEffect, useState } from 'react';
import { signalIdService } from '../services/signalIdService';
import type { SignalIdEntry } from '../services/signalIdService';

export function useSignalId(): SignalIdEntry | null {
  const [entry, setEntry] = useState<SignalIdEntry | null>(() => signalIdService.getActiveSignalId());

  useEffect(() => {
    return signalIdService.subscribe(setEntry);
  }, []);

  return entry;
}

export function useSignalIdHistory() {
  const [history, setHistory] = useState<SignalIdEntry[]>(() => signalIdService.getHistory());

  useEffect(() => {
    const unsub = signalIdService.subscribe(() => {
      setHistory(signalIdService.getHistory());
    });
    return unsub;
  }, []);

  return history;
}
