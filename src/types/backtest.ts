// Backtesting API types

export type BacktestSymbol = 'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'BTC/USD' | 'WTI/USD';
export type BacktestTimeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
export type BacktestResult = 'WIN' | 'LOSS' | 'BREAKEVEN';
export type BacktestStatus = 'IDLE' | 'RUNNING' | 'COMPLETED';

export interface BacktestConfig {
  symbol: BacktestSymbol;
  timeframe: BacktestTimeframe;
  strategy: BacktestStrategy;
  startDate: string;
  endDate: string;
  initialBalance: number;
  riskPerTrade: number;
}

export type BacktestStrategy =
  | 'SMC Scalp' | 'BOS Retest' | 'EMA Crossover' | 'Demand Zone'
  | 'Supply Zone' | 'CHOCH Reversal' | 'Liquidity Sweep' | 'Trend Follow'
  | 'News Fade' | 'Session Open';

export interface BacktestTrade {
  id: number;
  ticket: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pnl: number;
  pips: number;
  rr: number;
  result: BacktestResult;
  confidence: number;
  duration: string;
  date: string;
  time: string;
  balanceAfter: number;
}

export interface BacktestStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  largestWin: number;
  largestLoss: number;
  avgDurationMin: number;
  totalDurationMin: number;
  returnPct: number;
  expectancy: number;
}

export interface MonthlyReturn {
  month: string;
  pnl: number;
  returnPct: number;
  trades: number;
}

export interface TradeDistribution {
  range: string;
  count: number;
  pnl: number;
}

export interface BacktestReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  bestMonth: string;
  worstMonth: string;
  longestWinStreak: number;
  longestLossStreak: number;
  avgTradesPerDay: number;
  maxConsecutiveLosses: number;
}

export interface BacktestResultPayload {
  trades: BacktestTrade[];
  stats: BacktestStats;
  equityCurve: number[];
  drawdown: number[];
  monthly: MonthlyReturn[];
  distribution: TradeDistribution[];
  report: BacktestReport;
}

export interface RunBacktestRequest {
  symbol: BacktestSymbol;
  timeframe: BacktestTimeframe;
  strategy: BacktestStrategy;
  startDate: string;
  endDate: string;
  initialBalance: number;
  riskPerTrade: number;
}
