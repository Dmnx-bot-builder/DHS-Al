// DHS AI Trade Report types — derived from StrategyAnalysis

import type { TrendDirection, MarketCondition, AiDecision } from '../data/strategy';

export interface ReportSignalSummary {
  asset: string;
  time: string;
  direction: AiDecision;
  confidence: number;
  currentPrice: number;
  trendM30: TrendDirection;
}

export interface ReportMarketAnalysis {
  marketStructure: string;
  breakOfStructure: string;
  changeOfCharacter: string;
  liquiditySweep: string;
  demandSupplyZone: string;
  emaAlignment: string;
  rsi: string;
  macd: string;
  atr: string;
}

export interface ReportEntry {
  price: number;
  reason: string;
}

export interface ReportStopLoss {
  price: number;
  distancePips: number;
  reason: string;
}

export interface ReportTakeProfit {
  price: number;
  riskRewardRatio: number;
  reason: string;
}

export interface ReportInvalidation {
  conditions: string[];
}

export interface ReportRiskManagement {
  suggestedRiskPct: number;
  estimatedDuration: string;
  riskRewardRatio: number;
  positionSize: string | null;
}

export interface ReportConfidenceBreakdown {
  trendAlignment: number;
  marketStructure: number;
  smartMoneyConcepts: number;
  liquidity: number;
  indicators: number;
  riskQuality: number;
  overall: number;
}

export interface TradeReport {
  signal: ReportSignalSummary;
  marketAnalysis: ReportMarketAnalysis;
  entry: ReportEntry;
  stopLoss: ReportStopLoss;
  takeProfit: ReportTakeProfit;
  invalidation: ReportInvalidation;
  riskManagement: ReportRiskManagement;
  confidenceBreakdown: ReportConfidenceBreakdown;
  marketCondition: MarketCondition;
  session: string;
  signalId?: string;
}
