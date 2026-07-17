// Market data API types

export interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  changePct: number;
  high: number;
  low: number;
  session: string;
  timestamp: string;
}

export interface WatchlistItem {
  symbol: string;
  price: number;
  changePct: number;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export interface CandleRequest {
  symbol: string;
  timeframe: Timeframe;
  from?: string;
  to?: string;
  limit?: number;
}

export interface NewsEvent {
  id: string;
  time: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  currency: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

export interface MarketSession {
  name: string;
  open: string;
  close: string;
  isOpen: boolean;
  region: string;
}

export interface MarketStatus {
  sessions: MarketSession[];
  currentSession: string;
  isMarketOpen: boolean;
}
