// Signal lifecycle types — formal state machine for DHS AI signals

import type { AiDecision, TrendDirection, MarketCondition } from '../data/strategy';

export type SignalLifecycleStage =
  | 'DETECTED'
  | 'VALIDATING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'MONITORING'
  | 'TAKE_PROFIT_HIT'
  | 'STOP_LOSS_HIT'
  | 'INVALIDATED'
  | 'ARCHIVED';

export type SignalClosureReason =
  | 'TAKE_PROFIT'
  | 'STOP_LOSS'
  | 'INVALIDATED'
  | 'EXPIRED'
  | 'DIRECTION_CHANGED'
  | 'MANUAL_CLOSE';

export type SignalOutcome = 'PROFIT' | 'LOSS' | 'INVALIDATED' | 'EXPIRED' | 'PENDING';

export type NotificationPriority = 'CRITICAL' | 'IMPORTANT' | 'INFORMATIONAL';

export type QualityLevel =
  | 'ELITE_SETUP'
  | 'PREMIUM_SETUP'
  | 'HIGH_QUALITY'
  | 'TRADABLE'
  | 'IGNORE';

export interface SignalLifecycleRecord {
  signalId: string;
  decision: AiDecision;
  symbol: string;
  stage: SignalLifecycleStage;
  qualityScore: number;
  qualityLevel: QualityLevel;
  confidence: number;
  createdAt: number;
  confirmedAt: number | null;
  activatedAt: number | null;
  closedAt: number | null;
  archivedAt: number | null;
  closureReason: SignalClosureReason | null;
  outcome: SignalOutcome;
  trend: TrendDirection | null;
  marketCondition: MarketCondition | null;
  entryPrice: number | null;
  reportId: string | null;
}

export interface SignalQualityBreakdown {
  trendAlignment: number;
  marketStructure: number;
  breakOfStructure: number;
  liquiditySweep: number;
  demandSupplyZone: number;
  emaAlignment: number;
  rsiMacd: number;
  total: number;
  level: QualityLevel;
}

export interface SignalValidationResult {
  passed: boolean;
  confirmed: boolean;
  reasons: string[];
  validationCycle: number;
  nextValidationAt: number;
  checks: {
    candleClosed: boolean;
    confidenceAboveThreshold: boolean;
    bosValid: boolean;
    trendAligned: boolean;
    emaAligned: boolean;
    survivedCycle: boolean;
  };
}

export interface SignalAnalytics {
  totalGenerated: number;
  totalConfirmed: number;
  totalInvalidated: number;
  totalArchived: number;
  totalTakeProfit: number;
  totalStopLoss: number;
  averageSignalDuration: number;
  averageConfirmationTime: number;
  confirmationRate: number;
  invalidationRate: number;
  profitRate: number;
  notificationAccuracy: number;
}
