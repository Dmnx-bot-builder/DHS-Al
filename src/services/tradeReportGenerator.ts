// DHS AI Trade Report Generator
// Derives a structured TradeReport from StrategyAnalysis data.
// Every explanation is computed from the live strategy engine calculations.

import type { StrategyAnalysis, SmartMoneyConcept, MarketStructurePoint, ReasonItem } from '../data/strategy';
import type { TradeReport, ReportConfidenceBreakdown } from '../types/tradeReport';

const PIP_SIZE = 0.1;

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function pipsBetween(a: number, b: number): number {
  return Math.abs(a - b) / PIP_SIZE;
}

function describeMarketStructure(
  points: MarketStructurePoint[],
  direction: string,
): string {
  if (points.length === 0) {
    return 'No structural points detected on the current timeframe.';
  }

  const types = points.map((p) => p.type);
  const hasHH = types.includes('HH');
  const hasHL = types.includes('HL');
  const hasLH = types.includes('LH');
  const hasLL = types.includes('LL');

  if (direction === 'BULLISH' && hasHH && hasHL) {
    const lastHH = points.find((p) => p.type === 'HH');
    const lastHL = points.find((p) => p.type === 'HL');
    return `Market structure is bullish: sequence of Higher Highs (HH at ${formatPrice(lastHH?.price ?? 0)}) and Higher Lows (HL at ${formatPrice(lastHL?.price ?? 0)}). Price is making clean upward progress on the M15 timeframe.`;
  }

  if (direction === 'BEARISH' && hasLH && hasLL) {
    const lastLH = points.find((p) => p.type === 'LH');
    const lastLL = points.find((p) => p.type === 'LL');
    return `Market structure is bearish: sequence of Lower Highs (LH at ${formatPrice(lastLH?.price ?? 0)}) and Lower Lows (LL at ${formatPrice(lastLL?.price ?? 0)}). Price is making clean downward progress on the M15 timeframe.`;
  }

  if (hasHH && hasLL) {
    return 'Market structure is mixed: both Higher Highs and Lower Lows detected, indicating a ranging or choppy environment without a clear directional bias.';
  }

  return 'Market structure is forming with insufficient confirmation for a directional bias.';
}

function findSmc(
  concepts: SmartMoneyConcept[],
  type: string,
): SmartMoneyConcept | undefined {
  return concepts.find((c) => c.type === type);
}

function describeBos(concepts: SmartMoneyConcept[]): string {
  const bos = findSmc(concepts, 'BOS');
  if (!bos) {
    return 'No Break of Structure (BOS) detected on the current timeframe.';
  }
  const dir = bos.bullish ? 'bullish' : 'bearish';
  return `Break of Structure (${dir}) confirmed at ${formatPrice(bos.price)} — ${bos.description}. Status: ${bos.status}.`;
}

function describeChoch(concepts: SmartMoneyConcept[]): string {
  const choch = findSmc(concepts, 'CHOCH');
  if (!choch) {
    return 'No Change of Character (CHOCH) detected on the current timeframe.';
  }
  const dir = choch.bullish ? 'bullish' : 'bearish';
  return `Change of Character (${dir}) at ${formatPrice(choch.price)} — ${choch.description}. Status: ${choch.status}.`;
}

function describeLiquiditySweep(concepts: SmartMoneyConcept[]): string {
  const sweep = findSmc(concepts, 'SWEEP');
  if (!sweep) {
    return 'No liquidity sweep detected on the current timeframe.';
  }
  const dir = sweep.bullish ? 'buy-side' : 'sell-side';
  return `Liquidity sweep (${dir}) at ${formatPrice(sweep.price)} — ${sweep.description}. Status: ${sweep.status}.`;
}

function describeDemandSupply(concepts: SmartMoneyConcept[]): string {
  const demand = findSmc(concepts, 'DEMAND');
  const supply = findSmc(concepts, 'SUPPLY');

  const parts: string[] = [];
  if (demand) {
    parts.push(`Demand zone active at ${formatPrice(demand.price)} — ${demand.description} (status: ${demand.status})`);
  }
  if (supply) {
    parts.push(`Supply zone active at ${formatPrice(supply.price)} — ${supply.description} (status: ${supply.status})`);
  }
  if (parts.length === 0) {
    return 'No active demand or supply zones detected on the current timeframe.';
  }
  return parts.join('. ') + '.';
}

function describeEmaAlignment(ema50: number, ema200: number, entryPrice: number): string {
  const priceAbove50 = entryPrice > ema50;
  const priceAbove200 = entryPrice > ema200;
  const ema50Above200 = ema50 > ema200;

  if (priceAbove50 && priceAbove200 && ema50Above200) {
    return `EMA50 (${formatPrice(ema50)}) is above EMA200 (${formatPrice(ema200)}) and price (${formatPrice(entryPrice)}) is above both — classic bullish EMA alignment confirming upward momentum.`;
  }
  if (!priceAbove50 && !priceAbove200 && !ema50Above200) {
    return `EMA50 (${formatPrice(ema50)}) is below EMA200 (${formatPrice(ema200)}) and price (${formatPrice(entryPrice)}) is below both — classic bearish EMA alignment confirming downward momentum.`;
  }
  if (priceAbove50 && !ema50Above200) {
    return `Price (${formatPrice(entryPrice)}) is above EMA50 (${formatPrice(ema50)}) but EMA50 is below EMA200 (${formatPrice(ema200)}) — potential early bullish crossover forming, but trend not yet confirmed.`;
  }
  if (!priceAbove50 && ema50Above200) {
    return `Price (${formatPrice(entryPrice)}) is below EMA50 (${formatPrice(ema50)}) while EMA50 is above EMA200 (${formatPrice(ema200)}) — pullback within a broader bullish structure, watch for reclaim.`;
  }
  return `EMA50 at ${formatPrice(ema50)}, EMA200 at ${formatPrice(ema200)}, price at ${formatPrice(entryPrice)} — EMA alignment is neutral or transitional.`;
}

function describeRsi(rsi: number, direction: string): string {
  if (rsi >= 70) {
    return `RSI at ${rsi.toFixed(1)} — overbought territory. ${direction === 'BULLISH' ? 'Caution: bullish momentum may be exhausting.' : 'Potential reversal signal for bearish entries.'}`;
  }
  if (rsi <= 30) {
    return `RSI at ${rsi.toFixed(1)} — oversold territory. ${direction === 'BEARISH' ? 'Caution: bearish momentum may be exhausting.' : 'Potential reversal signal for bullish entries.'}`;
  }
  if (rsi >= 50) {
    return `RSI at ${rsi.toFixed(1)} — bullish momentum zone (above 50), room remaining before overbought. Supports ${direction === 'BULLISH' ? 'long' : 'short'} bias.`;
  }
  return `RSI at ${rsi.toFixed(1)} — below 50, momentum is weak. ${direction === 'BEARISH' ? 'Supports short bias.' : 'Does not yet confirm long bias.'}`;
}

function describeMacd(macd: number, signal: number, histogram: number): string {
  const histPositive = histogram >= 0;
  const macdAboveSignal = macd > signal;

  if (histPositive && macdAboveSignal) {
    return `MACD line at ${macd.toFixed(2)} above signal line at ${signal.toFixed(2)}; histogram at ${histogram.toFixed(2)} and expanding — bullish momentum is building.`;
  }
  if (!histPositive && !macdAboveSignal) {
    return `MACD line at ${macd.toFixed(2)} below signal line at ${signal.toFixed(2)}; histogram at ${histogram.toFixed(2)} and expanding — bearish momentum is building.`;
  }
  return `MACD line at ${macd.toFixed(2)}, signal at ${signal.toFixed(2)}, histogram at ${histogram.toFixed(2)} — momentum is transitional.`;
}

function describeAtr(atr: number, entryPrice: number, stopLoss: number): string {
  const slDistance = Math.abs(entryPrice - stopLoss);
  const atrMultiple = atr > 0 ? (slDistance / atr).toFixed(1) : 'N/A';
  return `ATR (14) at ${atr.toFixed(2)} — current stop loss is ${atrMultiple}x ATR, ${slDistance > atr ? 'providing adequate room for normal market noise.' : 'tight relative to current volatility.'}`;
}

function describeEntryReason(
  analysis: StrategyAnalysis,
): string {
  const { entryPrice, trend, indicators, decision } = analysis;

  if (decision === 'BUY') {
    if (entryPrice <= trend.ema50 && trend.direction === 'BULLISH') {
      return `Entry at ${formatPrice(entryPrice)} — price is pulling back toward EMA50 (${formatPrice(trend.ema50)}) within a bullish trend, offering a discount entry aligned with the higher-timeframe direction.`;
    }
    if (indicators.rsi >= 45 && indicators.rsi <= 65) {
      return `Entry at ${formatPrice(entryPrice)} — RSI at ${indicators.rsi.toFixed(1)} is in the healthy bullish zone (45–65), entering with momentum before overbought conditions.`;
    }
    return `Entry at ${formatPrice(entryPrice)} — aligned with bullish trend direction and confirmed market structure on the M15 timeframe.`;
  }

  if (decision === 'SELL') {
    if (entryPrice >= trend.ema50 && trend.direction === 'BEARISH') {
      return `Entry at ${formatPrice(entryPrice)} — price is pulling back toward EMA50 (${formatPrice(trend.ema50)}) within a bearish trend, offering a premium entry aligned with the higher-timeframe direction.`;
    }
    if (indicators.rsi >= 35 && indicators.rsi <= 55) {
      return `Entry at ${formatPrice(entryPrice)} — RSI at ${indicators.rsi.toFixed(1)} is in the healthy bearish zone (35–55), entering with momentum before oversold conditions.`;
    }
    return `Entry at ${formatPrice(entryPrice)} — aligned with bearish trend direction and confirmed market structure on the M15 timeframe.`;
  }

  return `No entry recommended at ${formatPrice(entryPrice)} — conditions do not meet the DHS Strategy Engine criteria for a high-probability trade.`;
}

function describeStopLossReason(
  analysis: StrategyAnalysis,
): string {
  const { stopLoss, entryPrice, structurePoints, smartMoneyConcepts, indicators, decision } = analysis;

  const parts: string[] = [];

  if (decision === 'BUY') {
    const lows = structurePoints.filter((p) => p.type === 'HL' || p.type === 'LL');
    if (lows.length > 0) {
      const lastLow = lows[lows.length - 1];
      if (Math.abs(stopLoss - lastLow.price) < Math.abs(entryPrice - lastLow.price)) {
        parts.push(`Placed below the latest swing low at ${formatPrice(lastLow.price)} (${lastLow.label})`);
      }
    }
    const demand = findSmc(smartMoneyConcepts, 'DEMAND');
    if (demand) {
      parts.push(`positioned outside the active demand zone at ${formatPrice(demand.price)} to avoid stop hunt`);
    }
  }

  if (decision === 'SELL') {
    const highs = structurePoints.filter((p) => p.type === 'HH' || p.type === 'LH');
    if (highs.length > 0) {
      const lastHigh = highs[highs.length - 1];
      if (Math.abs(stopLoss - lastHigh.price) < Math.abs(entryPrice - lastHigh.price)) {
        parts.push(`Placed above the latest swing high at ${formatPrice(lastHigh.price)} (${lastHigh.label})`);
      }
    }
    const supply = findSmc(smartMoneyConcepts, 'SUPPLY');
    if (supply) {
      parts.push(`positioned outside the active supply zone at ${formatPrice(supply.price)} to avoid stop hunt`);
    }
  }

  if (indicators.atr > 0) {
    const slDistance = Math.abs(entryPrice - stopLoss);
    const atrMultiple = (slDistance / indicators.atr).toFixed(1);
    parts.push(`${atrMultiple}x ATR (${indicators.atr.toFixed(2)}), protecting from normal market noise`);
  }

  if (parts.length === 0) {
    return `Stop loss at ${formatPrice(stopLoss)} — placed at a structural level that invalidates the trade thesis if breached.`;
  }

  return parts.join(', ') + '.';
}

function describeTakeProfitReason(
  analysis: StrategyAnalysis,
): string {
  const { takeProfit, entryPrice, stopLoss, structurePoints, smartMoneyConcepts, decision } = analysis;

  const parts: string[] = [];

  if (decision === 'BUY') {
    const highs = structurePoints.filter((p) => p.type === 'HH' || p.type === 'LH');
    if (highs.length > 0) {
      const lastHigh = highs[highs.length - 1];
      if (takeProfit > lastHigh.price) {
        parts.push(`targeting the previous swing high at ${formatPrice(lastHigh.price)} as the first liquidity target`);
      }
    }
    const supply = findSmc(smartMoneyConcepts, 'SUPPLY');
    if (supply) {
      parts.push(`next supply zone at ${formatPrice(supply.price)} acts as overhead resistance`);
    }
  }

  if (decision === 'SELL') {
    const lows = structurePoints.filter((p) => p.type === 'HL' || p.type === 'LL');
    if (lows.length > 0) {
      const lastLow = lows[lows.length - 1];
      if (takeProfit < lastLow.price) {
        parts.push(`targeting the previous swing low at ${formatPrice(lastLow.price)} as the first liquidity target`);
      }
    }
    const demand = findSmc(smartMoneyConcepts, 'DEMAND');
    if (demand) {
      parts.push(`next demand zone at ${formatPrice(demand.price)} acts as underlying support`);
    }
  }

  const rr = Math.abs(takeProfit - entryPrice) / Math.max(Math.abs(entryPrice - stopLoss), 0.0001);
  parts.push(`risk-to-reward ratio of ${rr.toFixed(2)}:1`);

  if (parts.length === 0) {
    return `Take profit at ${formatPrice(takeProfit)} — placed at the next major structural level.`;
  }

  return parts.join(', ') + '.';
}

function describeInvalidation(
  analysis: StrategyAnalysis,
): string[] {
  const { decision, smartMoneyConcepts, trend, indicators, structurePoints } = analysis;
  const conditions: string[] = [];

  if (decision === 'BUY') {
    const demand = findSmc(smartMoneyConcepts, 'DEMAND');
    if (demand) {
      conditions.push(`M15 candle closes below the demand zone at ${formatPrice(demand.price)}`);
    }
    conditions.push('Bearish Break of Structure (BOS) forms on the M15 timeframe');
    if (trend.direction === 'BULLISH' && trend.ema50 < trend.ema200) {
      conditions.push('EMA50 crosses below EMA200, flipping EMA alignment bearish');
    } else {
      conditions.push('Price closes below EMA50, indicating loss of bullish momentum');
    }
    if (indicators.rsi > 50) {
      conditions.push(`RSI drops below 50, losing bullish momentum (current: ${indicators.rsi.toFixed(1)})`);
    }
    const lows = structurePoints.filter((p) => p.type === 'HL' || p.type === 'LL');
    if (lows.length > 0) {
      const lastLow = lows[lows.length - 1];
      conditions.push(`Price closes below the last higher low at ${formatPrice(lastLow.price)}, invalidating the bullish structure`);
    }
  }

  if (decision === 'SELL') {
    const supply = findSmc(smartMoneyConcepts, 'SUPPLY');
    if (supply) {
      conditions.push(`M15 candle closes above the supply zone at ${formatPrice(supply.price)}`);
    }
    conditions.push('Bullish Break of Structure (BOS) forms on the M15 timeframe');
    if (trend.direction === 'BEARISH' && trend.ema50 > trend.ema200) {
      conditions.push('EMA50 crosses above EMA200, flipping EMA alignment bullish');
    } else {
      conditions.push('Price closes above EMA50, indicating loss of bearish momentum');
    }
    if (indicators.rsi < 50) {
      conditions.push(`RSI rises above 50, losing bearish momentum (current: ${indicators.rsi.toFixed(1)})`);
    }
    const highs = structurePoints.filter((p) => p.type === 'HH' || p.type === 'LH');
    if (highs.length > 0) {
      const lastHigh = highs[highs.length - 1];
      conditions.push(`Price closes above the last lower high at ${formatPrice(lastHigh.price)}, invalidating the bearish structure`);
    }
  }

  return conditions;
}

function describeRiskManagement(
  analysis: StrategyAnalysis,
): { suggestedRiskPct: number; estimatedDuration: string; positionSize: string | null } {
  const { confidence, indicators, timeframe } = analysis;

  let suggestedRiskPct: number;
  if (confidence >= 80) {
    suggestedRiskPct = 2;
  } else if (confidence >= 65) {
    suggestedRiskPct = 1.5;
  } else if (confidence >= 50) {
    suggestedRiskPct = 1;
  } else {
    suggestedRiskPct = 0.5;
  }

  const tfMinutes: Record<string, number> = {
    M1: 1, M5: 5, M15: 15, M30: 30, H1: 60, H4: 240, D1: 1440,
  };
  const tfMin = tfMinutes[timeframe] ?? 15;
  const atrCandles = indicators.atr > 0 ? Math.ceil(Math.abs(analysis.takeProfit - analysis.entryPrice) / indicators.atr) : 4;
  const estMinutes = Math.max(tfMin * 2, tfMin * atrCandles);

  let estimatedDuration: string;
  if (estMinutes < 60) {
    estimatedDuration = `${estMinutes}–${estMinutes * 2} minutes`;
  } else if (estMinutes < 1440) {
    estimatedDuration = `${Math.round(estMinutes / 60)}–${Math.round((estMinutes * 2) / 60)} hours`;
  } else {
    estimatedDuration = `${Math.round(estMinutes / 1440)}–${Math.round((estMinutes * 2) / 1440)} days`;
  }

  return {
    suggestedRiskPct,
    estimatedDuration,
    positionSize: null,
  };
}

function computeConfidenceBreakdown(
  reasons: ReasonItem[],
  confidence: number,
): ReportConfidenceBreakdown {
  const categoryWeights: Record<string, { passed: number; total: number }> = {};

  for (const r of reasons) {
    if (!categoryWeights[r.category]) {
      categoryWeights[r.category] = { passed: 0, total: 0 };
    }
    categoryWeights[r.category].total += r.weight;
    if (r.passed) {
      categoryWeights[r.category].passed += r.weight;
    }
  }

  function pctFor(cat: string): number {
    const w = categoryWeights[cat];
    if (!w || w.total === 0) return 0;
    return Math.round((w.passed / w.total) * 100);
  }

  const trendAlignment = pctFor('TREND');
  const marketStructure = pctFor('STRUCTURE');
  const smartMoneyConcepts = pctFor('SMC');
  const liquidity = reasons.some((r) => r.category === 'SMC' && r.text.toLowerCase().includes('liquidity'))
    ? Math.round((reasons.filter((r) => r.category === 'SMC' && r.text.toLowerCase().includes('liquidity') && r.passed).reduce((s, r) => s + r.weight, 0) /
      Math.max(reasons.filter((r) => r.category === 'SMC' && r.text.toLowerCase().includes('liquidity')).reduce((s, r) => s + r.weight, 0), 1)) * 100)
    : 0;
  const indicators = pctFor('INDICATOR');
  const riskQuality = pctFor('RISK');

  return {
    trendAlignment,
    marketStructure,
    smartMoneyConcepts,
    liquidity,
    indicators,
    riskQuality,
    overall: confidence,
  };
}

export function generateTradeReport(analysis: StrategyAnalysis): TradeReport {
  const signal = {
    asset: analysis.symbol,
    time: analysis.lastUpdated,
    direction: analysis.decision,
    confidence: analysis.confidence,
    currentPrice: analysis.entryPrice,
    trendM30: analysis.trend.direction,
  };

  const marketAnalysis = {
    marketStructure: describeMarketStructure(analysis.structurePoints, analysis.trend.direction),
    breakOfStructure: describeBos(analysis.smartMoneyConcepts),
    changeOfCharacter: describeChoch(analysis.smartMoneyConcepts),
    liquiditySweep: describeLiquiditySweep(analysis.smartMoneyConcepts),
    demandSupplyZone: describeDemandSupply(analysis.smartMoneyConcepts),
    emaAlignment: describeEmaAlignment(analysis.trend.ema50, analysis.trend.ema200, analysis.entryPrice),
    rsi: describeRsi(analysis.indicators.rsi, analysis.trend.direction),
    macd: describeMacd(analysis.indicators.macd, analysis.indicators.macdSignal, analysis.indicators.macdHistogram),
    atr: describeAtr(analysis.indicators.atr, analysis.entryPrice, analysis.stopLoss),
  };

  const entry = {
    price: analysis.entryPrice,
    reason: describeEntryReason(analysis),
  };

  const stopLoss = {
    price: analysis.stopLoss,
    distancePips: pipsBetween(analysis.entryPrice, analysis.stopLoss),
    reason: describeStopLossReason(analysis),
  };

  const takeProfit = {
    price: analysis.takeProfit,
    riskRewardRatio: analysis.riskRewardRatio,
    reason: describeTakeProfitReason(analysis),
  };

  const invalidation = {
    conditions: describeInvalidation(analysis),
  };

  const risk = describeRiskManagement(analysis);

  const riskManagement = {
    suggestedRiskPct: risk.suggestedRiskPct,
    estimatedDuration: risk.estimatedDuration,
    riskRewardRatio: analysis.riskRewardRatio,
    positionSize: risk.positionSize,
  };

  const confidenceBreakdown = computeConfidenceBreakdown(analysis.reasons, analysis.confidence);

  return {
    signal,
    marketAnalysis,
    entry,
    stopLoss,
    takeProfit,
    invalidation,
    riskManagement,
    confidenceBreakdown,
    marketCondition: analysis.marketCondition,
    session: analysis.session,
  };
}
