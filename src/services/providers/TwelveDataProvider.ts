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

export function createTwelveDataProvider(apiKey: string): MarketDataProvider {
  return {
    name: 'twelvedata',
    label: 'TwelveData',
    isLive: true,

    async fetchCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<OhlcCandle[]> {
      const tdSymbol = SYMBOL_MAP[symbol] ?? symbol;
      const tdInterval = TIMEFRAME_MAP[timeframe] ?? '15min';
      const url = `${BASE_URL}/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${tdInterval}&outputsize=${limit}&apikey=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message || 'TwelveData API error');
      if (!data.values || !Array.isArray(data.values)) throw new Error('TwelveData: unexpected response');

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

      const res = await fetch(url);
      if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message || 'TwelveData API error');

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
