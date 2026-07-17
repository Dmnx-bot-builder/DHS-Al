// TwelveData Market Data Provider — real-time OHLCV via TwelveData REST API

import type { MarketDataProvider, OhlcCandle, LiveQuote, Timeframe } from '../../types';

const BASE_URL = 'https://api.twelvedata.com';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  M1: '1min',
  M5: '5min',
  M15: '15min',
  M30: '30min',
  H1: '1h',
  H4: '4h',
  D1: '1day',
};

const SYMBOL_MAP: Record<string, string> = {
  'XAU/USD': 'XAU/USD',
};

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface TwelveDataQuote {
  symbol: string;
  name?: string;
  exchange?: string;
  currency_base?: string;
  currency_quote?: string;
  datetime: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, label: string): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 400 || res.status === 401 || res.status === 403) {
        return res;
      }
      if (res.status === 429) {
        console.warn(`[TwelveData] Rate limited on ${label} (attempt ${attempt}/${MAX_RETRIES}), retrying in ${BASE_DELAY_MS * attempt}ms…`);
      } else {
        console.warn(`[TwelveData] HTTP ${res.status} on ${label} (attempt ${attempt}/${MAX_RETRIES})`);
      }
      lastError = new Error(`TwelveData HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[TwelveData] Network error on ${label} (attempt ${attempt}/${MAX_RETRIES}): ${lastError.message}`);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * attempt);
    }
  }

  throw lastError ?? new Error(`TwelveData: ${label} failed after ${MAX_RETRIES} retries`);
}

export function createTwelveDataProvider(apiKey: string): MarketDataProvider {
  return {
    name: 'twelvedata',
    label: 'TwelveData',
    isLive: true,

    async fetchCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<OhlcCandle[]> {
      const tdSymbol = SYMBOL_MAP[symbol] ?? symbol;
      const tdInterval = TIMEFRAME_MAP[timeframe] ?? '15min';
      const url = `${BASE_URL}/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${tdInterval}&outputsize=${limit}&apikey=${apiKey}`;

      const res = await fetchWithRetry(url, `fetchCandles(${symbol}, ${timeframe})`);
      const data = await res.json();

      if (data.status === 'error') {
        const msg = data.message || 'TwelveData API error';
        console.error(`[TwelveData] fetchCandles API error: ${msg}`);
        throw new Error(msg);
      }
      if (!data.values || !Array.isArray(data.values)) {
        console.error('[TwelveData] fetchCandles: unexpected response structure', data);
        throw new Error('TwelveData: unexpected response');
      }

      return (data.values as TwelveDataCandle[]).map((c) => ({
        time: Math.floor(new Date(c.datetime + 'Z').getTime() / 1000),
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.volume) || 0,
      })).sort((a, b) => a.time - b.time);
    },

    async fetchQuote(symbol: string): Promise<LiveQuote> {
      const tdSymbol = SYMBOL_MAP[symbol] ?? symbol;
      const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(tdSymbol)}&apikey=${apiKey}`;

      const res = await fetchWithRetry(url, `fetchQuote(${symbol})`);
      const data = await res.json();

      if (data.status === 'error') {
        const msg = data.message || 'TwelveData API error';
        console.error(`[TwelveData] fetchQuote API error: ${msg}`);
        throw new Error(msg);
      }

      const q = data as TwelveDataQuote;
      const price = parseFloat(q.close);
      const changePct = q.percent_change ? parseFloat(q.percent_change) : 0;
      const spread = 0.15;

      return {
        symbol,
        price,
        bid: price - spread / 2,
        ask: price + spread / 2,
        spread,
        changePct,
        high: parseFloat(q.high),
        low: parseFloat(q.low),
        timestamp: Math.floor(Date.now() / 1000),
      };
    },
  };
}
