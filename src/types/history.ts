// Trade history API types

export type HistorySide = 'BUY' | 'SELL';
export type HistoryResult = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface HistoryTrade {
  id: string;
  ticket: string;
  symbol: string;
  side: HistorySide;
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pips: number;
  rr: number;
  duration: string;
  durationMinutes: number;
  strategy: string;
  confidence: number;
  result: HistoryResult;
  date: string;
  openTime: string;
  closeTime: string;
  commission: number;
  swap: number;
  netPnl: number;
}

export interface HistoryStats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  winPct: number;
  totalPnl: number;
  netPnl: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  avgDurationMin: number;
  avgConfidence: number;
  profitFactor: number;
}

export interface HistoryQueryParams {
  symbol?: string;
  side?: HistorySide;
  result?: HistoryResult;
  strategy?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface MonthlyPnl {
  month: string;
  pnl: number;
  wins: number;
  losses: number;
}

export interface StrategyStat {
  strategy: string;
  total: number;
  wins: number;
  pnl: number;
  winPct: number;
}
