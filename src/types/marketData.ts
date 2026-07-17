// Modular Market Data Service types

import type { Timeframe } from './market';

export type MarketDataMode = 'LIVE' | 'MOCK';

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

export type ProviderName = 'mock' | 'twelvedata' | 'polygon' | 'finnhub' | 'alphavantage';

export interface ProviderInfo {
  name: ProviderName;
  label: string;
  isLive: boolean;
}

export interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LiveQuote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  changePct: number;
  high: number;
  low: number;
  timestamp: number;
}

export interface CandleSubscription {
  symbol: string;
  timeframe: Timeframe;
  candles: OhlcCandle[];
  latestQuote: LiveQuote | null;
}

export interface MarketDataState {
  symbol: string;
  timeframe: Timeframe;
  candles: OhlcCandle[];
  latestQuote: LiveQuote | null;
  mode: MarketDataMode;
  status: ConnectionStatus;
  provider: ProviderInfo;
  lastUpdated: number | null;
  error: string | null;
}

export interface MarketDataProvider {
  readonly name: ProviderName;
  readonly label: string;
  readonly isLive: boolean;
  fetchCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<OhlcCandle[]>;
  fetchQuote(symbol: string): Promise<LiveQuote>;
}
