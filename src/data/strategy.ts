// Strategy analysis data layer for DHS AI terminal

export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type MarketCondition = 'TRENDING' | 'RANGING' | 'VOLATILE' | 'CHOPPY';
export type TradingSession = 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP';
export type AiDecision = 'BUY' | 'SELL' | 'NO_TRADE';

export interface TrendAnalysis {
  ema50: number;
  ema200: number;
  direction: TrendDirection;
  strength: number; // 0-100
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
  volumeCurrent: number;
  volumeAverage: number;
  stochK: number;
  stochD: number;
}

export interface ReasonItem {
  id: string;
  text: string;
  weight: number; // 1-10
  passed: boolean;
  category: 'TREND' | 'STRUCTURE' | 'SMC' | 'INDICATOR' | 'RISK' | 'SESSION';
}

export interface StrategyAnalysis {
  symbol: string;
  timeframe: string;
  session: TradingSession;
  marketCondition: MarketCondition;
  decision: AiDecision;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  trend: TrendAnalysis;
  structurePoints: MarketStructurePoint[];
  smartMoneyConcepts: SmartMoneyConcept[];
  indicators: IndicatorData;
  reasons: ReasonItem[];
  lastUpdated: string;
}

export const strategyData: StrategyAnalysis = {
  symbol: 'XAU/USD',
  timeframe: 'M15',
  session: 'NEW_YORK',
  marketCondition: 'TRENDING',
  decision: 'BUY',
  confidence: 84,
  entryPrice: 2378.42,
  stopLoss: 2368.5,
  takeProfit: 2398.5,
  riskRewardRatio: 2.01,
  lastUpdated: '14:48:33',
  trend: {
    ema50: 2375.18,
    ema200: 2341.62,
    direction: 'BULLISH',
    strength: 72,
    spread: 0.19,
  },
  structurePoints: [
    { id: 's1', type: 'HH', price: 2389.1, time: '12:30', label: 'Higher High' },
    { id: 's2', type: 'HL', price: 2371.4, time: '13:05', label: 'Higher Low' },
    { id: 's3', type: 'HH', price: 2384.7, time: '13:48', label: 'Higher High' },
    { id: 's4', type: 'HL', price: 2375.2, time: '14:15', label: 'Higher Low' },
  ],
  smartMoneyConcepts: [
    {
      id: 'smc1', type: 'BOS', label: 'Break of Structure',
      description: 'Price broke above 2384.7 with conviction, confirming bullish order flow',
      price: 2384.7, status: 'CONFIRMED', bullish: true,
    },
    {
      id: 'smc2', type: 'CHOCH', label: 'Change of Character',
      description: 'Minor CHOCH on M5 at 2372.1 signaled short-term shift, resolved bullish',
      price: 2372.1, status: 'MITIGATED', bullish: true,
    },
    {
      id: 'smc3', type: 'SWEEP', label: 'Liquidity Sweep',
      description: 'Swept sell-side liquidity below 2371.4 before reversal',
      price: 2371.4, status: 'CONFIRMED', bullish: true,
    },
    {
      id: 'smc4', type: 'SUPPLY', label: 'Supply Zone',
      description: 'Fresh supply overhead at 2392.0–2396.0, potential TP1 resistance',
      price: 2394.0, status: 'ACTIVE', bullish: false,
    },
    {
      id: 'smc5', type: 'DEMAND', label: 'Demand Zone',
      description: 'Strong demand zone 2370.0–2373.0 providing support for long',
      price: 2371.5, status: 'ACTIVE', bullish: true,
    },
  ],
  indicators: {
    rsi: 58.3,
    atr: 4.82,
    macd: 1.24,
    macdSignal: 0.86,
    macdHistogram: 0.38,
    volumeCurrent: 8420,
    volumeAverage: 6180,
    stochK: 72.4,
    stochD: 65.1,
  },
  reasons: [
    { id: 'r1', text: 'Price above both EMA50 and EMA200, confirming bullish trend', weight: 9, passed: true, category: 'TREND' },
    { id: 'r2', text: 'Sequence of HH/HL on M15 maintains bullish market structure', weight: 10, passed: true, category: 'STRUCTURE' },
    { id: 'r3', text: 'Break of Structure confirmed at 2384.7', weight: 9, passed: true, category: 'SMC' },
    { id: 'r4', text: 'Liquidity sweep below 2371.4 created fuel for upside', weight: 8, passed: true, category: 'SMC' },
    { id: 'r5', text: 'Demand zone 2370–2373 holding as valid support', weight: 7, passed: true, category: 'SMC' },
    { id: 'r6', text: 'RSI at 58.3 — bullish momentum, not overbought', weight: 7, passed: true, category: 'INDICATOR' },
    { id: 'r7', text: 'MACD histogram positive and expanding', weight: 6, passed: true, category: 'INDICATOR' },
    { id: 'r8', text: 'Volume 36% above average, confirming move strength', weight: 6, passed: true, category: 'INDICATOR' },
    { id: 'r9', text: 'New York session active with optimal liquidity', weight: 8, passed: true, category: 'SESSION' },
    { id: 'r10', text: 'Supply zone at 2392–2396 limits reward to 2.01R', weight: 5, passed: true, category: 'RISK' },
  ],
};

export const sessionTabs: { id: TradingSession; label: string; time: string; active: boolean }[] = [
  { id: 'ASIAN', label: 'Asian', time: '00:00–08:00', active: false },
  { id: 'LONDON', label: 'London', time: '08:00–16:00', active: false },
  { id: 'NEW_YORK', label: 'New York', time: '13:00–21:00', active: true },
  { id: 'OVERLAP', label: 'Overlap', time: '13:00–16:00', active: false },
];
