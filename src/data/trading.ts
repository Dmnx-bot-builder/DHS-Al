// Trading data layer for DHS AI terminal

export type Side = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface Trade {
  id: string;
  symbol: string;
  side: Side;
  lotSize: number;
  entryPrice: number;
  currentPrice?: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pips: number;
  status: TradeStatus;
  result?: TradeResult;
  openedAt: string;
  closedAt?: string;
  confidence: number;
  strategy: string;
}

export interface AccountStats {
  balance: number;
  equity: number;
  freeMargin: number;
  marginLevel: number;
  usedMargin: number;
  todayPnl: number;
  todayPnlPct: number;
  openPositions: number;
  winRate: number;
  riskPct: number;
  totalTrades: number;
  wins: number;
  losses: number;
  maxTrades: number;
}

export interface NewsItem {
  id: string;
  time: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  currency: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  changePct: number;
  high: number;
  low: number;
  session: string;
}

export interface WatchItem {
  symbol: string;
  price: number;
  changePct: number;
}

export const account: AccountStats = {
  balance: 52840.12,
  equity: 54317.86,
  freeMargin: 48902.41,
  marginLevel: 478.3,
  usedMargin: 5415.45,
  todayPnl: 1477.74,
  todayPnlPct: 2.79,
  openPositions: 7,
  winRate: 71.4,
  riskPct: 2.5,
  totalTrades: 312,
  wins: 223,
  losses: 89,
  maxTrades: 10,
};

export const goldMarket: MarketData = {
  symbol: 'XAU/USD',
  bid: 2378.42,
  ask: 2378.61,
  spread: 0.19,
  changePct: 0.64,
  high: 2389.1,
  low: 2369.55,
  session: 'New York',
};

export const trades: Trade[] = [
  {
    id: 't1', symbol: 'XAU/USD', side: 'BUY', lotSize: 0.3, entryPrice: 2375.4,
    currentPrice: 2378.42, stopLoss: 2370.4, takeProfit: 2385.4, pnl: 90.6, pips: 30.2,
    status: 'OPEN', openedAt: '14:32:11', confidence: 84, strategy: 'SMC Scalp',
  },
  {
    id: 't2', symbol: 'XAU/USD', side: 'SELL', lotSize: 0.2, entryPrice: 2381.2,
    currentPrice: 2378.42, stopLoss: 2386.2, takeProfit: 2371.2, pnl: 55.6, pips: 27.8,
    status: 'OPEN', openedAt: '13:18:44', confidence: 79, strategy: 'Liquidity Sweep',
  },
  {
    id: 't3', symbol: 'XAU/USD', side: 'BUY', lotSize: 0.5, entryPrice: 2372.1,
    currentPrice: 2378.42, stopLoss: 2367.1, takeProfit: 2387.1, pnl: 315.0, pips: 63.2,
    status: 'OPEN', openedAt: '12:05:09', confidence: 91, strategy: 'BOS Retest',
  },
  {
    id: 't4', symbol: 'XAU/USD', side: 'BUY', lotSize: 0.3, entryPrice: 2368.5,
    exitPrice: 2377.2, stopLoss: 2363.5, takeProfit: 2378.5, pnl: 261.0, pips: 87.0,
    status: 'CLOSED', result: 'WIN', openedAt: '10:12:33', closedAt: '11:44:08',
    confidence: 86, strategy: 'Demand Zone',
  },
  {
    id: 't5', symbol: 'XAU/USD', side: 'SELL', lotSize: 0.2, entryPrice: 2384.7,
    exitPrice: 2385.9, stopLoss: 2389.7, takeProfit: 2374.7, pnl: -24.0, pips: -12.0,
    status: 'CLOSED', result: 'LOSS', openedAt: '09:31:55', closedAt: '10:02:41',
    confidence: 62, strategy: 'Supply Zone',
  },
  {
    id: 't6', symbol: 'XAU/USD', side: 'BUY', lotSize: 0.4, entryPrice: 2370.8,
    exitPrice: 2376.8, stopLoss: 2365.8, takeProfit: 2378.8, pnl: 240.0, pips: 60.0,
    status: 'CLOSED', result: 'WIN', openedAt: '08:14:22', closedAt: '09:28:17',
    confidence: 88, strategy: 'EMA Crossover',
  },
  {
    id: 't7', symbol: 'XAU/USD', side: 'SELL', lotSize: 0.25, entryPrice: 2382.3,
    exitPrice: 2374.3, stopLoss: 2387.3, takeProfit: 2372.3, pnl: 200.0, pips: 80.0,
    status: 'CLOSED', result: 'WIN', openedAt: '07:45:01', closedAt: '08:55:30',
    confidence: 83, strategy: 'CHOCH Reversal',
  },
  {
    id: 't8', symbol: 'XAU/USD', side: 'BUY', lotSize: 0.3, entryPrice: 2376.5,
    exitPrice: 2376.5, stopLoss: 2371.5, takeProfit: 2386.5, pnl: 0.0, pips: 0.0,
    status: 'CLOSED', result: 'BREAKEVEN', openedAt: '06:20:14', closedAt: '07:05:50',
    confidence: 71, strategy: 'Session Open',
  },
];

export const news: NewsItem[] = [
  {
    id: 'n1', time: '15:30', title: 'US Core PCE Price Index (MoM)',
    impact: 'HIGH', currency: 'USD', forecast: '0.2%', previous: '0.2%', actual: '0.3%',
  },
  {
    id: 'n2', time: '16:00', title: 'ISM Manufacturing PMI',
    impact: 'HIGH', currency: 'USD', forecast: '48.8', previous: '48.7',
  },
  {
    id: 'n3', time: '17:00', title: 'Fed Chair Powell Speech',
    impact: 'HIGH', currency: 'USD', forecast: '—', previous: '—',
  },
  {
    id: 'n4', time: '13:15', title: 'ADP Non-Farm Employment Change',
    impact: 'MEDIUM', currency: 'USD', forecast: '160K', previous: '152K', actual: '150K',
  },
  {
    id: 'n5', time: '12:30', title: 'Initial Jobless Claims',
    impact: 'LOW', currency: 'USD', forecast: '236K', previous: '233K', actual: '234K',
  },
];

// Equity curve: 24 points rising from 50000 to 54317.86 with realistic noise
export const equityCurve: number[] = [
  50000, 50210, 49880, 50450, 50920, 50780, 51230, 51540,
  51120, 51680, 52030, 51790, 52210, 52480, 52130, 52690,
  53040, 52820, 53260, 53580, 53340, 53820, 54110, 54317.86,
];

export const watchlist: WatchItem[] = [
  { symbol: 'XAU/USD', price: 2378.42, changePct: 0.64 },
  { symbol: 'EUR/USD', price: 1.0842, changePct: -0.12 },
  { symbol: 'GBP/USD', price: 1.2715, changePct: 0.21 },
  { symbol: 'USD/JPY', price: 157.82, changePct: 0.35 },
  { symbol: 'BTC/USD', price: 61428.5, changePct: 2.18 },
  { symbol: 'WTI/USD', price: 81.45, changePct: -0.48 },
];

export function formatCurrency(value: number, decimals = 2): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
