// SignalLifecycleManager — formal state machine for DHS AI signals.
//
// Lifecycle stages:
//   DETECTED -> VALIDATING -> CONFIRMED -> ACTIVE -> MONITORING
//     -> TAKE_PROFIT_HIT | STOP_LOSS_HIT | INVALIDATED -> ARCHIVED
//
// Every signal always exists in exactly one lifecycle stage.
// Tracks timestamps, closure reason, and outcome for each signal.

import type { AiDecision, TrendDirection, MarketCondition } from '../data/strategy';
import type {
  SignalLifecycleStage,
  SignalLifecycleRecord,
  SignalClosureReason,
  SignalOutcome,
  QualityLevel,
} from '../types/signalLifecycle';

const STORAGE_KEY = 'dhs-ai-signal-lifecycle';
const HISTORY_KEY = 'dhs-ai-signal-lifecycle-history';
const MAX_HISTORY = 200;

type Listener = (state: LifecycleState) => void;

export interface LifecycleState {
  active: SignalLifecycleRecord | null;
  history: SignalLifecycleRecord[];
}

const VALID_TRANSITIONS: Record<SignalLifecycleStage, SignalLifecycleStage[]> = {
  DETECTED: ['VALIDATING', 'INVALIDATED', 'ARCHIVED'],
  VALIDATING: ['CONFIRMED', 'INVALIDATED', 'ARCHIVED'],
  CONFIRMED: ['ACTIVE', 'INVALIDATED', 'ARCHIVED'],
  ACTIVE: ['MONITORING', 'TAKE_PROFIT_HIT', 'STOP_LOSS_HIT', 'INVALIDATED', 'ARCHIVED'],
  MONITORING: ['TAKE_PROFIT_HIT', 'STOP_LOSS_HIT', 'INVALIDATED', 'ARCHIVED', 'ACTIVE'],
  TAKE_PROFIT_HIT: ['ARCHIVED'],
  STOP_LOSS_HIT: ['ARCHIVED'],
  INVALIDATED: ['ARCHIVED'],
  ARCHIVED: [],
};

function loadActiveFromStorage(): SignalLifecycleRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SignalLifecycleRecord;
    if (parsed && typeof parsed.signalId === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveActiveToStorage(record: SignalLifecycleRecord | null): void {
  try {
    if (record) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function loadHistoryFromStorage(): SignalLifecycleRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SignalLifecycleRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.signalId === 'string');
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history: SignalLifecycleRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // ignore
  }
}

function determineOutcome(reason: SignalClosureReason): SignalOutcome {
  switch (reason) {
    case 'TAKE_PROFIT': return 'PROFIT';
    case 'STOP_LOSS': return 'LOSS';
    case 'INVALIDATED': return 'INVALIDATED';
    case 'EXPIRED': return 'EXPIRED';
    case 'DIRECTION_CHANGED': return 'INVALIDATED';
    case 'MANUAL_CLOSE': return 'PENDING';
  }
}

class SignalLifecycleManager {
  private listeners = new Set<Listener>();
  private active: SignalLifecycleRecord | null;
  private history: SignalLifecycleRecord[];

  constructor() {
    this.active = loadActiveFromStorage();
    this.history = loadHistoryFromStorage();
  }

  getState(): LifecycleState {
    return {
      active: this.active ? { ...this.active } : null,
      history: [...this.history],
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach((l) => l(snapshot));
  }

  getActive(): SignalLifecycleRecord | null {
    return this.active ? { ...this.active } : null;
  }

  getHistory(): SignalLifecycleRecord[] {
    return [...this.history];
  }

  /**
   * Creates a new signal in the DETECTED stage.
   * If an active signal already exists, it is archived first.
   */
  create(params: {
    signalId: string;
    decision: AiDecision;
    symbol: string;
    qualityScore: number;
    qualityLevel: QualityLevel;
    confidence: number;
    trend: TrendDirection;
    marketCondition: MarketCondition;
    entryPrice: number;
  }): SignalLifecycleRecord {
    if (this.active) {
      this.archive('DIRECTION_CHANGED');
    }

    const now = Date.now();
    const record: SignalLifecycleRecord = {
      signalId: params.signalId,
      decision: params.decision,
      symbol: params.symbol,
      stage: 'DETECTED',
      qualityScore: params.qualityScore,
      qualityLevel: params.qualityLevel,
      confidence: params.confidence,
      createdAt: now,
      confirmedAt: null,
      activatedAt: null,
      closedAt: null,
      archivedAt: null,
      closureReason: null,
      outcome: 'PENDING',
      trend: params.trend,
      marketCondition: params.marketCondition,
      entryPrice: params.entryPrice,
      reportId: null,
    };

    this.active = record;
    saveActiveToStorage(record);
    this.notify();
    return record;
  }

  /**
   * Transitions the active signal to a new stage.
   * Validates that the transition is allowed.
   */
  transition(stage: SignalLifecycleStage): SignalLifecycleRecord | null {
    if (!this.active) return null;

    const currentStage = this.active.stage;
    if (!VALID_TRANSITIONS[currentStage].includes(stage)) {
      console.warn(`Invalid lifecycle transition: ${currentStage} -> ${stage}`);
      return null;
    }

    const now = Date.now();
    this.active = { ...this.active, stage };

    if (stage === 'CONFIRMED' && this.active.confirmedAt === null) {
      this.active.confirmedAt = now;
    }
    if (stage === 'ACTIVE' && this.active.activatedAt === null) {
      this.active.activatedAt = now;
    }
    if (stage === 'TAKE_PROFIT_HIT' || stage === 'STOP_LOSS_HIT' || stage === 'INVALIDATED') {
      this.active.closedAt = now;
    }

    saveActiveToStorage(this.active);
    this.notify();
    return this.active;
  }

  /**
   * Updates the active signal's quality score and confidence without changing stage.
   */
  updateMetrics(qualityScore: number, qualityLevel: QualityLevel, confidence: number): void {
    if (!this.active) return;
    this.active = {
      ...this.active,
      qualityScore,
      qualityLevel,
      confidence,
    };
    saveActiveToStorage(this.active);
    this.notify();
  }

  /**
   * Attaches a report ID to the active signal.
   */
  setReportId(reportId: string): void {
    if (!this.active) return;
    this.active = { ...this.active, reportId };
    saveActiveToStorage(this.active);
    this.notify();
  }

  /**
   * Archives the active signal with a closure reason.
   * Moves it to history and clears the active record.
   */
  archive(reason: SignalClosureReason): void {
    if (!this.active) return;

    const now = Date.now();
    const archived: SignalLifecycleRecord = {
      ...this.active,
      stage: 'ARCHIVED',
      archivedAt: now,
      closedAt: this.active.closedAt ?? now,
      closureReason: reason,
      outcome: determineOutcome(reason),
    };

    this.history = [archived, ...this.history.filter((e) => e.signalId !== archived.signalId)].slice(0, MAX_HISTORY);
    saveHistoryToStorage(this.history);
    this.active = null;
    saveActiveToStorage(null);
    this.notify();
  }

  /**
   * Closes the active signal with a specific reason (TP hit, SL hit, or invalidated).
   * This transitions through the closure stage and then archives.
   */
  close(reason: SignalClosureReason): void {
    if (!this.active) return;

    const closureStage: SignalLifecycleStage =
      reason === 'TAKE_PROFIT' ? 'TAKE_PROFIT_HIT' :
      reason === 'STOP_LOSS' ? 'STOP_LOSS_HIT' :
      'INVALIDATED';

    this.transition(closureStage);
    this.archive(reason);
  }

  /**
   * Resets the lifecycle manager (useful for testing).
   */
  reset(): void {
    this.active = null;
    this.history = [];
    saveActiveToStorage(null);
    saveHistoryToStorage([]);
    this.notify();
  }
}

export const signalLifecycleManager = new SignalLifecycleManager();
