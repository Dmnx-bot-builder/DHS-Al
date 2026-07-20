// SignalQualityCalculator — calculates a Signal Quality Score (0-100)
// independently of the existing decision engine's confidence percentage.
// Uses weighted scoring across 7 market-structure dimensions.

import type { StrategyAnalysis, SmartMoneyConcept, TrendDirection } from '../data/strategy';
import type { SignalQualityBreakdown, QualityLevel } from '../types/signalLifecycle';

const WEIGHTS = {
  trendAlignment: 25,
  marketStructure: 20,
  breakOfStructure: 15,
  liquiditySweep: 15,
  demandSupplyZone: 10,
  emaAlignment: 10,
  rsiMacd: 5,
} as const;

const QUALITY_THRESHOLDS: { min: number; level: QualityLevel }[] = [
  { min: 95, level: 'ELITE_SETUP' },
  { min: 90, level: 'PREMIUM_SETUP' },
  { min: 80, level: 'HIGH_QUALITY' },
  { min: 70, level: 'TRADABLE' },
  { min: 0, level: 'IGNORE' },
];

function findSmc(concepts: SmartMoneyConcept[], type: string): SmartMoneyConcept | undefined {
  return concepts.find((c) => c.type === type);
}

function scoreTrendAlignment(direction: TrendDirection, strength: number, decision: string): number {
  if (direction === 'NEUTRAL') return 20;
  const aligned =
    (decision === 'BUY' && direction === 'BULLISH') ||
    (decision === 'SELL' && direction === 'BEARISH');
  if (!aligned) return 10;
  const strengthScore = Math.min(100, Math.max(40, strength));
  return Math.round(60 + (strengthScore - 40) * 0.4);
}

function scoreMarketStructure(analysis: StrategyAnalysis): number {
  const points = analysis.structurePoints;
  if (points.length === 0) return 20;
  const types = points.map((p) => p.type);
  const isBull = analysis.decision === 'BUY';
  const isBear = analysis.decision === 'SELL';

  if (isBull && types.includes('HH') && types.includes('HL')) return 100;
  if (isBear && types.includes('LH') && types.includes('LL')) return 100;
  if (types.includes('HH') && types.includes('LL')) return 40;
  return 60;
}

function scoreBos(concepts: SmartMoneyConcept[], decision: string): number {
  const bos = findSmc(concepts, 'BOS');
  if (!bos) return 0;
  if (bos.status !== 'CONFIRMED' && bos.status !== 'ACTIVE') return 30;
  const aligned =
    (decision === 'BUY' && bos.bullish) ||
    (decision === 'SELL' && !bos.bullish);
  return aligned ? 100 : 40;
}

function scoreLiquiditySweep(concepts: SmartMoneyConcept[], decision: string): number {
  const sweep = findSmc(concepts, 'SWEEP');
  if (!sweep) return 0;
  if (sweep.status !== 'CONFIRMED' && sweep.status !== 'ACTIVE') return 30;
  const aligned =
    (decision === 'BUY' && sweep.bullish) ||
    (decision === 'SELL' && !sweep.bullish);
  return aligned ? 100 : 40;
}

function scoreDemandSupply(concepts: SmartMoneyConcept[], decision: string): number {
  const demand = findSmc(concepts, 'DEMAND');
  const supply = findSmc(concepts, 'SUPPLY');
  const hasDemand = demand && (demand.status === 'ACTIVE' || demand.status === 'CONFIRMED');
  const hasSupply = supply && (supply.status === 'ACTIVE' || supply.status === 'CONFIRMED');

  if (decision === 'BUY' && hasDemand) return 100;
  if (decision === 'SELL' && hasSupply) return 100;
  if (hasDemand || hasSupply) return 50;
  return 0;
}

function scoreEmaAlignment(analysis: StrategyAnalysis): number {
  const { ema50, ema200, direction } = analysis.trend;
  const price = analysis.entryPrice;
  const priceAbove50 = price > ema50;
  const priceAbove200 = price > ema200;
  const ema50Above200 = ema50 > ema200;

  if (analysis.decision === 'BUY') {
    if (priceAbove50 && priceAbove200 && ema50Above200 && direction === 'BULLISH') return 100;
    if (priceAbove50 && ema50Above200) return 70;
    if (priceAbove50) return 50;
    return 20;
  }
  if (analysis.decision === 'SELL') {
    if (!priceAbove50 && !priceAbove200 && !ema50Above200 && direction === 'BEARISH') return 100;
    if (!priceAbove50 && !ema50Above200) return 70;
    if (!priceAbove50) return 50;
    return 20;
  }
  return 40;
}

function scoreRsiMacd(analysis: StrategyAnalysis): number {
  const { rsi, macd, macdSignal, macdHistogram } = analysis.indicators;
  const decision = analysis.decision;
  let score = 0;

  if (decision === 'BUY') {
    if (rsi >= 45 && rsi <= 70) score += 50;
    else if (rsi > 30 && rsi < 80) score += 25;
    if (macd > macdSignal && macdHistogram > 0) score += 50;
    else if (macdHistogram > 0) score += 25;
  } else if (decision === 'SELL') {
    if (rsi >= 30 && rsi <= 55) score += 50;
    else if (rsi > 20 && rsi < 70) score += 25;
    if (macd < macdSignal && macdHistogram < 0) score += 50;
    else if (macdHistogram < 0) score += 25;
  } else {
    score = 20;
  }

  return Math.min(100, score);
}

function determineLevel(total: number): QualityLevel {
  for (const t of QUALITY_THRESHOLDS) {
    if (total >= t.min) return t.level;
  }
  return 'IGNORE';
}

export function calculateQualityScore(analysis: StrategyAnalysis): SignalQualityBreakdown {
  const trendAlignment = scoreTrendAlignment(analysis.trend.direction, analysis.trend.strength, analysis.decision);
  const marketStructure = scoreMarketStructure(analysis);
  const breakOfStructure = scoreBos(analysis.smartMoneyConcepts, analysis.decision);
  const liquiditySweep = scoreLiquiditySweep(analysis.smartMoneyConcepts, analysis.decision);
  const demandSupplyZone = scoreDemandSupply(analysis.smartMoneyConcepts, analysis.decision);
  const emaAlignment = scoreEmaAlignment(analysis);
  const rsiMacd = scoreRsiMacd(analysis);

  const total = Math.round(
    (trendAlignment * WEIGHTS.trendAlignment +
      marketStructure * WEIGHTS.marketStructure +
      breakOfStructure * WEIGHTS.breakOfStructure +
      liquiditySweep * WEIGHTS.liquiditySweep +
      demandSupplyZone * WEIGHTS.demandSupplyZone +
      emaAlignment * WEIGHTS.emaAlignment +
      rsiMacd * WEIGHTS.rsiMacd) / 100,
  );

  return {
    trendAlignment,
    marketStructure,
    breakOfStructure,
    liquiditySweep,
    demandSupplyZone,
    emaAlignment,
    rsiMacd,
    total: Math.min(100, Math.max(0, total)),
    level: determineLevel(total),
  };
}

export function getQualityLevel(score: number): QualityLevel {
  return determineLevel(score);
}

export const QUALITY_WEIGHTS = WEIGHTS;

export const QUALITY_LEVEL_LABELS: Record<QualityLevel, string> = {
  ELITE_SETUP: 'Elite Setup',
  PREMIUM_SETUP: 'Premium Setup',
  HIGH_QUALITY: 'High Quality',
  TRADABLE: 'Tradable',
  IGNORE: 'Ignore',
};
