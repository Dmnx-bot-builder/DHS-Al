// Mock Market Data Provider — generates realistic OHLCV candles for XAU/USD

import type { MarketDataProvider, OhlcCandle, LiveQuote, Timeframe } from '../../types';

const TIMEFRAME_MS: Record<Timeframe, number> = {
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
};

const BASE_PRICE = 2378.50;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateCandles(symbol: string, timeframe: Timeframe, limit: number): OhlcCandle[] {
  const interval = TIMEFRAME_MS[timeframe] ?? TIMEFRAME_MS.M15;
  const now = Date.now();
  const alignedNow = Math.floor(now / interval) * interval;
  const rng = seededRandom(symbol.charCodeAt(0) * 1000 + timeframe.charCodeAt(0));

  const candles: OhlcCandle[] = [];
  let prevClose = BASE_PRICE;
  let trendBias = 0;

  for (let i = limit - 1; i >= 0; i--) {
    const time = alignedNow - i * interval;
    const drift = (rng() - 0.48) * 2.5;
    trendBias = trendBias * 0.7 + drift * 0.3;

    const open = prevClose;
    const volatility = 0.8 + rng() * 1.2;
    const change = trendBias * volatility + (rng() - 0.5) * 1.5;
    const close = Math.max(1000, open + change);
    const wickUp = rng() * volatility;
    const wickDown = rng() * volatility;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = Math.floor(500 + rng() * 2000);

    candles.push({ time, open, high, low, close, volume });
    prevClose = close;
  }

  return candles;
}

export const MockProvider: MarketDataProvider = {
  name: 'mock',
  label: 'Mock Data',
  isLive: false,

  async fetchCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<OhlcCandle[]> {
    await new Promise((r) => setTimeout(r, 200));
    return generateCandles(symbol, timeframe, limit);
  },

  async fetchQuote(symbol: string): Promise<LiveQuote> {
    await new Promise((r) => setTimeout(r, 150));
    const candles = generateCandles(symbol, 'M1', 2);
    const latest = candles[candles.length - 1];
    const first = candles[0];
    const spread = 0.15 + Math.random() * 0.12;
    const changePct = ((latest.close - first.open) / first.open) * 100;

    return {
      symbol,
      price: latest.close,
      bid: latest.close - spread / 2,
      ask: latest.close + spread / 2,
      spread,
      changePct,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      timestamp: Date.now(),
    };
  },
};
