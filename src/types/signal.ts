// Trade signal & strategy analysis API types

export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type MarketCondition = 'TRENDING' | 'RANGING' | 'VOLATILE' | 'CHOPPY';
export type AiDecision = 'BUY' | 'SELL' | 'NO_TRADE';

export interface TrendAnalysis {
  ema50: number;
  ema200: number;
  direction: TrendDirection;
  strength: number;
  spread: number;
}

export interface MarketStructurePoint {
  id: string;
  type: 'HH' | 'HL' | 'LH' | 'LL';
  price: number;
  time: string;
  label: string;
}

export type SmcType = 'BOS' | 'CHOCH' | 'SWEEP' | 'SUPPLY' | 'DEMAND';

export interface SmartMoneyConcept {
  id: string;
  type: SmcType;
  label: string;
  description: string;
  price: number;
  status: 'ACTIVE' | 'FORMING' | 'CONFIRMED' | 'MITIGATED';
  bullish: boolean;
}

export interface IndicatorData {
  rsi: number;
  atr: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  stochK: number;
  stochD: number;
  volume: number;
  avgVolume: number;
}

export interface ReasonItem {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  category: string;
}

export interface SignalRequest {
  symbol: string;
  timeframe?: string;
}

export interface TradeSignal {
  id: string;
  symbol: string;
  timeframe: string;
  decision: AiDecision;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  trend: TrendAnalysis;
  marketStructure: MarketStructurePoint[];
  smartMoneyConcepts: SmartMoneyConcept[];
  indicators: IndicatorData;
  reasons: ReasonItem[];
  marketCondition: MarketCondition;
  session: string;
  lastUpdated: string;
}
