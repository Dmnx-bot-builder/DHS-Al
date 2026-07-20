// useSignalAnalytics — React hook wrapping SignalAnalyticsService

import { useEffect, useState } from 'react';
import { signalAnalyticsService } from '../services/signalAnalyticsService';
import type { SignalAnalytics } from '../types/signalLifecycle';

export function useSignalAnalytics(): SignalAnalytics {
  const [analytics, setAnalytics] = useState<SignalAnalytics>(() => signalAnalyticsService.getAnalytics());

  useEffect(() => {
    return signalAnalyticsService.subscribe(setAnalytics);
  }, []);

  return analytics;
}
