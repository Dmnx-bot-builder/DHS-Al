// SignalValidationService — sits between the DHS Strategy Engine and
// StrategyEventManager. Validates every signal before it can become an
// official DHS signal and generate notifications.
//
// Does NOT modify StrategyAnalysis. Only determines whether a signal is
// mature enough to become official.
//
// Default confirmation rules:
//   1. M5 candle must close (simulated via validation cycle timer)
//   2. Confidence must remain above the notification threshold after candle close
//   3. BOS must still be valid
//   4. Trend alignment must remain unchanged
//   5. EMA alignment must remain unchanged
//   6. Signal must survive one complete validation cycle
//
// Future-proofed: the confirmation timeframe (M1, M5, M15) can be configured
// without changing the architecture.

import type { StrategyAnalysis, AiDecision, TrendDirection } from '../data/strategy';
import type { SignalValidationResult } from '../types/signalLifecycle';

export type ConfirmationTimeframe = 'M1' | 'M5' | 'M15';

export interface ValidationConfig {
  timeframe: ConfirmationTimeframe;
  confidenceThreshold: number;
  requireBos: boolean;
  requireTrendAlignment: boolean;
  requireEmaAlignment: boolean;
  validationCyclesRequired: number;
}

const TIMEFRAME_DURATIONS_MS: Record<ConfirmationTimeframe, number> = {
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
};

const DEFAULT_CONFIG: ValidationConfig = {
  timeframe: 'M5',
  confidenceThreshold: 60,
  requireBos: true,
  requireTrendAlignment: true,
  requireEmaAlignment: true,
  validationCyclesRequired: 1,
};

interface PendingValidation {
  signalId: string;
  decision: AiDecision;
  symbol: string;
  confidence: number;
  trend: TrendDirection;
  ema50: number;
  ema200: number;
  bosId: string | null;
  startedAt: number;
  cyclesCompleted: number;
  nextValidationAt: number;
}

type Listener = (state: ValidationState) => void;

export interface ValidationState {
  pending: PendingValidation | null;
  lastResult: SignalValidationResult | null;
  config: ValidationConfig;
}

class SignalValidationService {
  private listeners = new Set<Listener>();
  private config: ValidationConfig = { ...DEFAULT_CONFIG };
  private pending: PendingValidation | null = null;
  private lastResult: SignalValidationResult | null = null;
  private lastAnalysis: StrategyAnalysis | null = null;

  getState(): ValidationState {
    return {
      pending: this.pending ? { ...this.pending } : null,
      lastResult: this.lastResult,
      config: { ...this.config },
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

  configure(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
    this.notify();
  }

  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  getValidationDurationMs(): number {
    return TIMEFRAME_DURATIONS_MS[this.config.timeframe];
  }

  /**
   * Begins a new validation cycle for a signal. Returns the pending validation entry.
   * If a validation is already in progress for the same decision, it continues.
   * If the decision changed, the previous validation is discarded and a new one starts.
   */
  beginValidation(analysis: StrategyAnalysis, signalId: string): PendingValidation {
    const bos = analysis.smartMoneyConcepts.find((c) => c.type === 'BOS');
    const now = Date.now();

    // If pending validation has the same decision and same signal, keep it
    if (
      this.pending &&
      this.pending.decision === analysis.decision &&
      this.pending.signalId === signalId
    ) {
      this.pending = {
        ...this.pending,
        confidence: analysis.confidence,
        trend: analysis.trend.direction,
        ema50: analysis.trend.ema50,
        ema200: analysis.trend.ema200,
        bosId: bos?.id ?? null,
      };
      this.notify();
      return this.pending;
    }

    this.pending = {
      signalId,
      decision: analysis.decision,
      symbol: analysis.symbol,
      confidence: analysis.confidence,
      trend: analysis.trend.direction,
      ema50: analysis.trend.ema50,
      ema200: analysis.trend.ema200,
      bosId: bos?.id ?? null,
      startedAt: now,
      cyclesCompleted: 0,
      nextValidationAt: now + this.getValidationDurationMs(),
    };
    this.notify();
    return this.pending;
  }

  /**
   * Validates the current pending signal against the latest analysis.
   * Returns the validation result. If all checks pass and the required
   * number of cycles is completed, the signal is confirmed.
   */
  validate(analysis: StrategyAnalysis): SignalValidationResult {
    this.lastAnalysis = analysis;
    const now = Date.now();

    if (!this.pending) {
      const result: SignalValidationResult = {
        passed: false,
        confirmed: false,
        reasons: ['No pending signal to validate'],
        validationCycle: 0,
        nextValidationAt: now + this.getValidationDurationMs(),
        checks: {
          candleClosed: false,
          confidenceAboveThreshold: false,
          bosValid: false,
          trendAligned: false,
          emaAligned: false,
          survivedCycle: false,
        },
      };
      this.lastResult = result;
      this.notify();
      return result;
    }

    const p = this.pending;
    const reasons: string[] = [];
    const cycleElapsed = now - p.startedAt >= this.getValidationDurationMs();

    // Check 1: Candle closed (simulated by cycle elapsed)
    const candleClosed = cycleElapsed;
    if (!candleClosed) reasons.push(`Waiting for ${this.config.timeframe} candle close`);

    // Check 2: Confidence above threshold
    const confidenceAboveThreshold = analysis.confidence >= this.config.confidenceThreshold;
    if (!confidenceAboveThreshold) {
      reasons.push(`Confidence ${analysis.confidence}% below threshold ${this.config.confidenceThreshold}%`);
    }

    // Check 3: BOS still valid
    const currentBos = analysis.smartMoneyConcepts.find((c) => c.type === 'BOS');
    const bosValid = !this.config.requireBos || (currentBos !== undefined && currentBos.status !== 'MITIGATED');
    if (!bosValid) reasons.push('BOS is no longer valid');

    // Check 4: Trend alignment unchanged
    const trendAligned = !this.config.requireTrendAlignment || analysis.trend.direction === p.trend;
    if (!trendAligned) reasons.push('Trend alignment changed during validation');

    // Check 5: EMA alignment unchanged
    const emaAligned =
      !this.config.requireEmaAlignment ||
      (analysis.trend.ema50 === p.ema50 && analysis.trend.ema200 === p.ema200);
    if (!emaAligned) reasons.push('EMA alignment changed during validation');

    // Check 6: Survived one complete validation cycle
    if (cycleElapsed) {
      p.cyclesCompleted++;
    }
    const survivedCycle = p.cyclesCompleted >= this.config.validationCyclesRequired;
    if (!survivedCycle) reasons.push(`Survived ${p.cyclesCompleted}/${this.config.validationCyclesRequired} cycles`);

    const allChecksPassed =
      candleClosed &&
      confidenceAboveThreshold &&
      bosValid &&
      trendAligned &&
      emaAligned &&
      survivedCycle;

    const confirmed = allChecksPassed;

    const result: SignalValidationResult = {
      passed: allChecksPassed,
      confirmed,
      reasons: reasons.length > 0 ? reasons : ['All validation checks passed'],
      validationCycle: p.cyclesCompleted,
      nextValidationAt: now + this.getValidationDurationMs(),
      checks: {
        candleClosed,
        confidenceAboveThreshold,
        bosValid,
        trendAligned,
        emaAligned,
        survivedCycle,
      },
    };

    if (confirmed) {
      // Clear pending — signal is now confirmed
      this.pending = null;
    } else {
      // Update pending with latest data
      this.pending = {
        ...p,
        confidence: analysis.confidence,
        nextValidationAt: result.nextValidationAt,
      };
    }

    this.lastResult = result;
    this.notify();
    return result;
  }

  /**
   * Returns true if there is a pending validation that has not yet been confirmed.
   */
  hasPending(): boolean {
    return this.pending !== null;
  }

  /**
   * Returns the current pending validation entry, or null.
   */
  getPending(): PendingValidation | null {
    return this.pending ? { ...this.pending } : null;
  }

  /**
   * Clears the pending validation (e.g., when a signal is invalidated).
   */
  clearPending(): void {
    this.pending = null;
    this.lastResult = null;
    this.notify();
  }

  /**
   * Resets the validation service to its initial state.
   */
  reset(): void {
    this.pending = null;
    this.lastResult = null;
    this.lastAnalysis = null;
    this.config = { ...DEFAULT_CONFIG };
    this.notify();
  }
}

export const signalValidationService = new SignalValidationService();
