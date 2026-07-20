// SignalAnalyticsService — tracks signal lifecycle metrics for dashboard use.
// Records counts, durations, and notification accuracy across all signals.

import type { SignalLifecycleRecord, SignalAnalytics } from '../types/signalLifecycle';

const STORAGE_KEY = 'dhs-ai-signal-analytics';

interface AnalyticsData {
  totalGenerated: number;
  totalConfirmed: number;
  totalInvalidated: number;
  totalArchived: number;
  totalTakeProfit: number;
  totalStopLoss: number;
  totalNotificationsSent: number;
  totalNotificationsAccurate: number;
  signalDurations: number[];
  confirmationTimes: number[];
}

type Listener = (analytics: SignalAnalytics) => void;

function loadData(): AnalyticsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as AnalyticsData;
    if (!parsed || typeof parsed.totalGenerated !== 'number') return defaultData();
    return {
      totalGenerated: parsed.totalGenerated ?? 0,
      totalConfirmed: parsed.totalConfirmed ?? 0,
      totalInvalidated: parsed.totalInvalidated ?? 0,
      totalArchived: parsed.totalArchived ?? 0,
      totalTakeProfit: parsed.totalTakeProfit ?? 0,
      totalStopLoss: parsed.totalStopLoss ?? 0,
      totalNotificationsSent: parsed.totalNotificationsSent ?? 0,
      totalNotificationsAccurate: parsed.totalNotificationsAccurate ?? 0,
      signalDurations: parsed.signalDurations ?? [],
      confirmationTimes: parsed.confirmationTimes ?? [],
    };
  } catch {
    return defaultData();
  }
}

function defaultData(): AnalyticsData {
  return {
    totalGenerated: 0,
    totalConfirmed: 0,
    totalInvalidated: 0,
    totalArchived: 0,
    totalTakeProfit: 0,
    totalStopLoss: 0,
    totalNotificationsSent: 0,
    totalNotificationsAccurate: 0,
    signalDurations: [],
    confirmationTimes: [],
  };
}

function saveData(data: AnalyticsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      signalDurations: data.signalDurations.slice(-200),
      confirmationTimes: data.confirmationTimes.slice(-200),
    }));
  } catch {
    // ignore
  }
}

function computeAnalytics(data: AnalyticsData): SignalAnalytics {
  const avgDuration = data.signalDurations.length > 0
    ? Math.round(data.signalDurations.reduce((s, d) => s + d, 0) / data.signalDurations.length)
    : 0;
  const avgConfirmation = data.confirmationTimes.length > 0
    ? Math.round(data.confirmationTimes.reduce((s, d) => s + d, 0) / data.confirmationTimes.length)
    : 0;
  const confirmationRate = data.totalGenerated > 0
    ? Math.round((data.totalConfirmed / data.totalGenerated) * 100)
    : 0;
  const invalidationRate = data.totalConfirmed > 0
    ? Math.round((data.totalInvalidated / data.totalConfirmed) * 100)
    : 0;
  const profitRate = (data.totalTakeProfit + data.totalStopLoss) > 0
    ? Math.round((data.totalTakeProfit / (data.totalTakeProfit + data.totalStopLoss)) * 100)
    : 0;
  const notificationAccuracy = data.totalNotificationsSent > 0
    ? Math.round((data.totalNotificationsAccurate / data.totalNotificationsSent) * 100)
    : 0;

  return {
    totalGenerated: data.totalGenerated,
    totalConfirmed: data.totalConfirmed,
    totalInvalidated: data.totalInvalidated,
    totalArchived: data.totalArchived,
    totalTakeProfit: data.totalTakeProfit,
    totalStopLoss: data.totalStopLoss,
    averageSignalDuration: avgDuration,
    averageConfirmationTime: avgConfirmation,
    confirmationRate,
    invalidationRate,
    profitRate,
    notificationAccuracy,
  };
}

class SignalAnalyticsService {
  private data: AnalyticsData;
  private listeners = new Set<Listener>();

  constructor() {
    this.data = loadData();
  }

  getAnalytics(): SignalAnalytics {
    return computeAnalytics(this.data);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getAnalytics());
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const snapshot = this.getAnalytics();
    this.listeners.forEach((l) => l(snapshot));
  }

  recordSignalGenerated(): void {
    this.data.totalGenerated++;
    saveData(this.data);
    this.notify();
  }

  recordSignalConfirmed(confirmationTimeMs: number): void {
    this.data.totalConfirmed++;
    this.data.confirmationTimes.push(confirmationTimeMs);
    saveData(this.data);
    this.notify();
  }

  recordSignalInvalidated(): void {
    this.data.totalInvalidated++;
    saveData(this.data);
    this.notify();
  }

  recordSignalArchived(durationMs: number): void {
    this.data.totalArchived++;
    this.data.signalDurations.push(durationMs);
    saveData(this.data);
    this.notify();
  }

  recordTakeProfit(): void {
    this.data.totalTakeProfit++;
    saveData(this.data);
    this.notify();
  }

  recordStopLoss(): void {
    this.data.totalStopLoss++;
    saveData(this.data);
    this.notify();
  }

  recordNotificationSent(): void {
    this.data.totalNotificationsSent++;
    saveData(this.data);
    this.notify();
  }

  recordNotificationAccurate(): void {
    this.data.totalNotificationsAccurate++;
    saveData(this.data);
    this.notify();
  }

  recordArchivedFromHistory(record: SignalLifecycleRecord): void {
    this.data.totalArchived++;
    if (record.closedAt && record.createdAt) {
      this.data.signalDurations.push(record.closedAt - record.createdAt);
    }
    if (record.closureReason === 'TAKE_PROFIT') this.data.totalTakeProfit++;
    if (record.closureReason === 'STOP_LOSS') this.data.totalStopLoss++;
    if (record.closureReason === 'INVALIDATED' || record.closureReason === 'DIRECTION_CHANGED') {
      this.data.totalInvalidated++;
    }
    saveData(this.data);
    this.notify();
  }

  reset(): void {
    this.data = defaultData();
    saveData(this.data);
    this.notify();
  }
}

export const signalAnalyticsService = new SignalAnalyticsService();
