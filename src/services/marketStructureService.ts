// MarketStructureService — derives live market structure from OHLC candles.
// Replaces the static structurePoints array from /data/strategy.ts.
// Produces: Higher High, Higher Low, Lower High, Lower Low, BOS, CHOCH,
// Liquidity Sweep, Demand Zone, Supply Zone — all from real candle data.
// Updates automatically as new candles arrive.

import type { OhlcCandle } from '../types';
import type {
  MarketStructurePoint, SmartMoneyConcept, TrendAnalysis,
  StrategyAnalysis, AiDecision, ReasonItem, MarketCondition, TradingSession,
} from '../data/strategy';

const LOOKBACK = 50;
const PIVOT_WINDOW = 3;
const SWEEP_THRESHOLD_PCT = 0.0008;

function findPivots(candles: OhlcCandle[]): { highs: OhlcCandle[]; lows: OhlcCandle[] } {
  const highs: OhlcCandle[] = [];
  const lows: OhlcCandle[] = [];
  const slice = candles.slice(-LOOKBACK);

  for (let i = PIVOT_WINDOW; i < slice.length - PIVOT_WINDOW; i++) {
    const candle = slice[i];
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= PIVOT_WINDOW; j++) {
      if (slice[i - j].high >= candle.high) isHigh = false;
      if (slice[i + j].high >= candle.high) isHigh = false;
      if (slice[i - j].low <= candle.low) isLow = false;
      if (slice[i + j].low <= candle.low) isLow = false;
    }
    if (isHigh) highs.push(candle);
    if (isLow) lows.push(candle);
  }
  return { highs, lows };
}

function classifyStructure(
  highs: OhlcCandle[], lows: OhlcCandle[],
): { points: MarketStructurePoint[]; bullish: boolean } {
  const points: MarketStructurePoint[] = [];
  const combined: { candle: OhlcCandle; type: 'high' | 'low' }[] = [
    ...highs.map((c) => ({ candle: c, type: 'high' as const })),
    ...lows.map((c) => ({ candle: c, type: 'low' as const })),
  ].sort((a, b) => a.candle.time - b.candle.time);

  let prevHigh = 0;
  let prevLow = 0;
  let bullCount = 0;
  let bearCount = 0;

  combined.forEach((item, idx) => {
    const c = item.candle;
    const timeStr = new Date(c.time * 1000).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
    if (item.type === 'high') {
      const type = c.high > prevHigh ? 'HH' : 'LH';
      if (type === 'HH') bullCount++; else bearCount++;
      points.push({
        id: `p${idx}`,
        type,
        price: c.high,
        time: timeStr,
        label: type === 'HH' ? 'Higher High' : 'Lower High',
      });
      prevHigh = c.high;
    } else {
      const type = c.low > prevLow ? 'HL' : 'LL';
      if (type === 'HL') bullCount++; else bearCount++;
      points.push({
        id: `p${idx}`,
        type,
        price: c.low,
        time: timeStr,
        label: type === 'HL' ? 'Higher Low' : 'Lower Low',
      });
      prevLow = c.low;
    }
  });

  return { points: points.slice(-8), bullish: bullCount >= bearCount };
}

function detectBosChoch(
  candles: OhlcCandle[], points: MarketStructurePoint[], bullish: boolean,
): SmartMoneyConcept[] {
  const concepts: SmartMoneyConcept[] = [];
  const recent = candles.slice(-20);
  if (recent.length < 5 || points.length < 2) return concepts;

  const lastPrice = recent[recent.length - 1].close;
  const recentHighs = points.filter((p) => p.type === 'HH' || p.type === 'LH').slice(-2);
  const recentLows = points.filter((p) => p.type === 'HL' || p.type === 'LL').slice(-2);

  if (recentHighs.length >= 2) {
    const prevHigh = recentHighs[0].price;
    const lastHigh = recentHighs[1].price;
    if (lastPrice > lastHigh && lastHigh > prevHigh) {
      concepts.push({
        id: 'smc-bos',
        type: 'BOS',
        label: 'Break of Structure',
        description: `Price broke above ${lastHigh.toFixed(2)}, confirming ${bullish ? 'bullish' : 'bearish'} order flow`,
        price: lastHigh,
        status: 'CONFIRMED',
        bullish,
      });
    } else if (lastPrice < prevHigh && lastHigh < prevHigh) {
      concepts.push({
        id: 'smc-choch',
        type: 'CHOCH',
        label: 'Change of Character',
        description: `Price broke below ${prevHigh.toFixed(2)}, signaling short-term shift`,
        price: prevHigh,
        status: 'CONFIRMED',
        bullish: false,
      });
    }
  }

  if (recentLows.length >= 2) {
    const prevLow = recentLows[0].price;
    const lastLow = recentLows[1].price;
    if (lastPrice < lastLow && lastLow < prevLow) {
      concepts.push({
        id: 'smc-bos-dn',
        type: 'BOS',
        label: 'Break of Structure',
        description: `Price broke below ${lastLow.toFixed(2)}, confirming bearish order flow`,
        price: lastLow,
        status: 'CONFIRMED',
        bullish: false,
      });
    }
  }

  return concepts;
}

function detectSweep(candles: OhlcCandle[], points: MarketStructurePoint[]): SmartMoneyConcept | null {
  const recent = candles.slice(-10);
  if (recent.length < 3 || points.length < 2) return null;

  const lastCandle = recent[recent.length - 1];
  const priorLows = points.filter((p) => p.type === 'HL' || p.type === 'LL').slice(-2);
  const priorHighs = points.filter((p) => p.type === 'HH' || p.type === 'LH').slice(-2);

  for (const low of priorLows) {
    const swept = lastCandle.low < low.price;
    const recovered = lastCandle.close > low.price;
    if (swept && recovered) {
      const deviation = Math.abs(lastCandle.low - low.price) / low.price;
      if (deviation > SWEEP_THRESHOLD_PCT) {
        return {
          id: 'smc-sweep',
          type: 'SWEEP',
          label: 'Liquidity Sweep',
          description: `Swept sell-side liquidity below ${low.price.toFixed(2)} before reversal`,
          price: low.price,
          status: 'CONFIRMED',
          bullish: true,
        };
      }
    }
  }

  for (const high of priorHighs) {
    const swept = lastCandle.high > high.price;
    const recovered = lastCandle.close < high.price;
    if (swept && recovered) {
      const deviation = Math.abs(lastCandle.high - high.price) / high.price;
      if (deviation > SWEEP_THRESHOLD_PCT) {
        return {
          id: 'smc-sweep-up',
          type: 'SWEEP',
          label: 'Liquidity Sweep',
          description: `Swept buy-side liquidity above ${high.price.toFixed(2)} before reversal`,
          price: high.price,
          status: 'CONFIRMED',
          bullish: false,
        };
      }
    }
  }
  return null;
}

function detectZones(candles: OhlcCandle[], points: MarketStructurePoint[]): SmartMoneyConcept[] {
  const concepts: SmartMoneyConcept[] = [];
  const recent = candles.slice(-30);
  if (recent.length < 10) return concepts;

  const lows = points.filter((p) => p.type === 'HL' || p.type === 'LL').slice(-2);
  const highs = points.filter((p) => p.type === 'HH' || p.type === 'LH').slice(-2);

  if (lows.length > 0) {
    const lowPrice = lows[lows.length - 1].price;
    concepts.push({
      id: 'smc-demand',
      type: 'DEMAND',
      label: 'Demand Zone',
      description: `Demand zone ${(lowPrice * 0.999).toFixed(2)}–${(lowPrice * 1.001).toFixed(2)} providing support`,
      price: lowPrice,
      status: 'ACTIVE',
      bullish: true,
    });
  }

  if (highs.length > 0) {
    const highPrice = highs[highs.length - 1].price;
    concepts.push({
      id: 'smc-supply',
      type: 'SUPPLY',
      label: 'Supply Zone',
      description: `Supply zone ${(highPrice * 0.999).toFixed(2)}–${(highPrice * 1.001).toFixed(2)} overhead resistance`,
      price: highPrice,
      status: 'ACTIVE',
      bullish: false,
    });
  }

  return concepts;
}

function calcEma(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcRsi(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcAtr(candles: OhlcCandle[], period = 14): number {
  if (candles.length < 2) return 0;
  const slice = candles.slice(-period);
  let sum = 0;
  for (let i = 0; i < slice.length; i++) {
    if (i === 0) {
      sum += slice[i].high - slice[i].low;
    } else {
      const prev = slice[i - 1];
      const curr = slice[i];
      const tr = Math.max(
        curr.high - curr.low,
        Math.abs(curr.high - prev.close),
        Math.abs(curr.low - prev.close),
      );
      sum += tr;
    }
  }
  return sum / slice.length;
}

function calcMacd(values: number[]): { macd: number; signal: number; hist: number } {
  if (values.length < 26) return { macd: 0, signal: 0, hist: 0 };
  const ema12 = calcEma(values.slice(-26), 12);
  const ema26 = calcEma(values.slice(-26), 26);
  const macd = ema12 - ema26;
  const signalSlice: number[] = [];
  for (let i = 0; i <= 9; i++) {
    const chunk = values.slice(-26 - 9 + i, -9 + i);
    if (chunk.length >= 26) signalSlice.push(calcEma(chunk, 12) - calcEma(chunk, 26));
  }
  const signal = signalSlice.length > 0 ? calcEma(signalSlice, 9) : macd;
  return { macd, signal, hist: macd - signal };
}

function calcStoch(candles: OhlcCandle[], period = 14): { k: number; d: number } {
  if (candles.length < period) return { k: 50, d: 50 };
  const ks: number[] = [];
  for (let i = period; i <= candles.length; i++) {
    const slice = candles.slice(i - period, i);
    const high = Math.max(...slice.map((c) => c.high));
    const low = Math.min(...slice.map((c) => c.low));
    const close = slice[slice.length - 1].close;
    const k = high === low ? 50 : ((close - low) / (high - low)) * 100;
    ks.push(k);
  }
  const k = ks[ks.length - 1] ?? 50;
  const d = ks.length >= 3 ? (ks[ks.length - 1] + ks[ks.length - 2] + ks[ks.length - 3]) / 3 : k;
  return { k, d };
}

function getCurrentSession(): TradingSession {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 8) return 'ASIAN';
  if (hour >= 8 && hour < 13) return 'LONDON';
  if (hour >= 13 && hour < 16) return 'OVERLAP';
  if (hour >= 16 && hour < 21) return 'NEW_YORK';
  return 'ASIAN';
}

function classifyMarketCondition(candles: OhlcCandle[], atr: number): MarketCondition {
  if (candles.length < 20) return 'CHOPPY';
  const recent = candles.slice(-20);
  const range = Math.max(...recent.map((c) => c.high)) - Math.min(...recent.map((c) => c.low));
  const avgRange = range / 20;
  const atrRatio = atr > 0 ? avgRange / atr : 1;

  const closes = recent.map((c) => c.close);
  const direction = closes[closes.length - 1] - closes[0];
  const directionPct = Math.abs(direction) / closes[0];

  if (atrRatio > 1.5 && directionPct > 0.01) return 'VOLATILE';
  if (directionPct > 0.005) return 'TRENDING';
  if (atrRatio < 0.8) return 'RANGING';
  return 'CHOPPY';
}

function determineDecision(
  bullish: boolean, trendDir: TrendAnalysis['direction'],
  rsi: number, macdHist: number, confidence: number,
): AiDecision {
  if (confidence < 60) return 'NO_TRADE';
  if (bullish && trendDir === 'BULLISH' && rsi < 70 && macdHist > 0) return 'BUY';
  if (!bullish && trendDir === 'BEARISH' && rsi > 30 && macdHist < 0) return 'SELL';
  return 'NO_TRADE';
}

/**
 * Computes a complete StrategyAnalysis from live OHLC candles.
 * This is the ONE StrategyAnalysis object every screen reads.
 */
export function computeStrategyAnalysis(
  candles: OhlcCandle[],
  symbol: string,
  timeframe: string,
  currentPrice: number,
): StrategyAnalysis {
  if (candles.length < 20) {
    return {
      symbol, timeframe,
      session: getCurrentSession(),
      marketCondition: 'CHOPPY',
      decision: 'NO_TRADE',
      confidence: 0,
      entryPrice: currentPrice,
      stopLoss: currentPrice,
      takeProfit: currentPrice,
      riskRewardRatio: 0,
      lastUpdated: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      trend: { ema50: currentPrice, ema200: currentPrice, direction: 'NEUTRAL', strength: 0, spread: 0 },
      structurePoints: [],
      smartMoneyConcepts: [],
      indicators: { rsi: 50, atr: 0, macd: 0, macdSignal: 0, macdHistogram: 0, volumeCurrent: 0, volumeAverage: 0, stochK: 50, stochD: 50 },
      reasons: [],
    };
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const ema50 = calcEma(closes.slice(-50), 50);
  const ema200 = calcEma(closes.slice(-200), 200);
  const rsi = calcRsi(closes);
  const atr = calcAtr(candles);
  const macd = calcMacd(closes);
  const stoch = calcStoch(candles);
  const volumeCurrent = volumes[volumes.length - 1] ?? 0;
  const volumeAverage = volumes.length > 20
    ? volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
    : volumeCurrent;

  const { highs, lows } = findPivots(candles);
  const { points, bullish } = classifyStructure(highs, lows);
  const bosChoch = detectBosChoch(candles, points, bullish);
  const sweep = detectSweep(candles, points);
  const zones = detectZones(candles, points);
  const smartMoneyConcepts = [...bosChoch, ...(sweep ? [sweep] : []), ...zones];

  const trendDir: TrendAnalysis['direction'] =
    ema50 > ema200 && currentPrice > ema50 ? 'BULLISH'
    : ema50 < ema200 && currentPrice < ema50 ? 'BEARISH'
    : 'NEUTRAL';

  const trendStrength = Math.min(100, Math.abs((ema50 - ema200) / ema200) * 1000);
  const spread = atr * 0.1;

  const marketCondition = classifyMarketCondition(candles, atr);

  const confidence = Math.min(100, Math.round(
    (trendDir !== 'NEUTRAL' ? 25 : 0)
    + (smartMoneyConcepts.filter((s) => s.bullish === bullish).length * 8)
    + (rsi > 30 && rsi < 70 ? 15 : 5)
    + (macd.hist > 0 === bullish ? 15 : 5)
    + (volumeCurrent > volumeAverage ? 10 : 5)
    + (points.filter((p) => bullish ? p.type === 'HH' || p.type === 'HL' : p.type === 'LH' || p.type === 'LL').length * 3),
  ));

  const decision = determineDecision(bullish, trendDir, rsi, macd.hist, confidence);

  const atrForSl = Math.max(atr, currentPrice * 0.001);
  const stopLoss = decision === 'BUY'
    ? currentPrice - atrForSl * 1.5
    : decision === 'SELL'
      ? currentPrice + atrForSl * 1.5
      : currentPrice;
  const takeProfit = decision === 'BUY'
    ? currentPrice + atrForSl * 3
    : decision === 'SELL'
      ? currentPrice - atrForSl * 3
      : currentPrice;
  const riskRewardRatio = decision !== 'NO_TRADE' && atrForSl > 0 ? 2 : 0;

  const reasons: ReasonItem[] = [
    { id: 'r1', text: `Price ${currentPrice > ema50 ? 'above' : 'below'} EMA50 and ${currentPrice > ema200 ? 'above' : 'below'} EMA200, ${trendDir.toLowerCase()} trend`, weight: 9, passed: trendDir !== 'NEUTRAL', category: 'TREND' },
    { id: 'r2', text: `Market structure: ${points.filter((p) => p.type === 'HH' || p.type === 'HL').length} HH/HL, ${points.filter((p) => p.type === 'LH' || p.type === 'LL').length} LH/LL`, weight: 10, passed: points.length > 0, category: 'STRUCTURE' },
    { id: 'r3', text: `BOS ${bosChoch.some((s) => s.type === 'BOS') ? 'confirmed' : 'not detected'} at ${bosChoch.find((s) => s.type === 'BOS')?.price.toFixed(2) ?? 'N/A'}`, weight: 9, passed: bosChoch.some((s) => s.type === 'BOS'), category: 'SMC' },
    { id: 'r4', text: sweep ? `Liquidity sweep ${sweep.bullish ? 'below' : 'above'} ${sweep.price.toFixed(2)}` : 'No liquidity sweep detected', weight: 8, passed: sweep !== null, category: 'SMC' },
    { id: 'r5', text: `RSI at ${rsi.toFixed(1)} — ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral momentum'}`, weight: 7, passed: rsi > 30 && rsi < 70, category: 'INDICATOR' },
    { id: 'r6', text: `MACD histogram ${macd.hist > 0 ? 'positive' : 'negative'} (${macd.hist.toFixed(2)})`, weight: 6, passed: (macd.hist > 0) === bullish, category: 'INDICATOR' },
    { id: 'r7', text: `Volume ${volumeCurrent > volumeAverage ? 'above' : 'below'} average (${((volumeCurrent / volumeAverage - 1) * 100).toFixed(0)}%)`, weight: 6, passed: volumeCurrent > volumeAverage, category: 'INDICATOR' },
    { id: 'r8', text: `${getCurrentSession()} session active`, weight: 8, passed: true, category: 'SESSION' },
    { id: 'r9', text: `ATR ${atr.toFixed(2)} — ${marketCondition.toLowerCase()} market`, weight: 5, passed: marketCondition !== 'CHOPPY', category: 'RISK' },
  ];

  return {
    symbol, timeframe,
    session: getCurrentSession(),
    marketCondition,
    decision, confidence,
    entryPrice: currentPrice,
    stopLoss, takeProfit, riskRewardRatio,
    lastUpdated: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    trend: {
      ema50, ema200, direction: trendDir, strength: Math.round(trendStrength), spread,
    },
    structurePoints: points,
    smartMoneyConcepts,
    indicators: {
      rsi, atr,
      macd: macd.macd, macdSignal: macd.signal, macdHistogram: macd.hist,
      volumeCurrent, volumeAverage,
      stochK: stoch.k, stochD: stoch.d,
    },
    reasons,
  };
}