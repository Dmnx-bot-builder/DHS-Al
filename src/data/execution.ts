// Execution data layer for DHS AI terminal

export type TradingMode = 'MANUAL' | 'SEMI_AUTO' | 'FULL_AUTO';
export type TradingEngine = 'MT5' | 'CTRADER' | 'BROKER_API';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'FILLED' | 'PARTIAL' | 'REJECTED' | 'CANCELLED';

export interface OpenPosition {
  id: string;
  ticket: number;
  symbol: string;
  side: OrderSide;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pips: number;
  swap: number;
  commission: number;
  openedAt: string;
  strategy: string;
  mode: TradingMode;
}

export interface ExecutionLogEntry {
  id: string;
  time: string;
  type: 'ORDER' | 'FILL' | 'CLOSE' | 'MODIFY' | 'REJECT' | 'INFO' | 'SYSTEM';
  message: string;
  status: OrderStatus;
  ticket?: number;
  symbol?: string;
}

export interface TradeSettings {
  lotSize: number;
  riskPct: number;
  stopLoss: number; // pips
  takeProfit: number; // pips
  riskRewardRatio: number;
  maxDailyLoss: number;
  maxTrades: number;
  maxConsecutiveLosses: number;
}

export interface BrokerConnection {
  name: string;
  server: string;
  login: string;
  connected: boolean;
  latencyMs: number;
  leverage: string;
  currency: string;
}

export const brokerConnection: BrokerConnection = {
  name: 'IC Markets',
  server: 'ICMarketsSC-Live21',
  login: '5104****',
  connected: true,
  latencyMs: 38,
  leverage: '1:500',
  currency: 'USD',
};

export const defaultSettings: TradeSettings = {
  lotSize: 0.3,
  riskPct: 2.5,
  stopLoss: 15,
  takeProfit: 30,
  riskRewardRatio: 2.0,
  maxDailyLoss: 500,
  maxTrades: 10,
  maxConsecutiveLosses: 3,
};

export const openPositions: OpenPosition[] = [
  {
    id: 'p1', ticket: 50421873, symbol: 'XAU/USD', side: 'BUY', lotSize: 0.3,
    entryPrice: 2375.4, currentPrice: 2378.42, stopLoss: 2370.4, takeProfit: 2385.4,
    pnl: 90.6, pips: 30.2, swap: -0.42, commission: -3.6, openedAt: '14:32:11',
    strategy: 'SMC Scalp', mode: 'SEMI_AUTO',
  },
  {
    id: 'p2', ticket: 50421874, symbol: 'XAU/USD', side: 'SELL', lotSize: 0.2,
    entryPrice: 2381.2, currentPrice: 2378.42, stopLoss: 2386.2, takeProfit: 2371.2,
    pnl: 55.6, pips: 27.8, swap: -0.28, commission: -2.4, openedAt: '13:18:44',
    strategy: 'Liquidity Sweep', mode: 'MANUAL',
  },
  {
    id: 'p3', ticket: 50421875, symbol: 'XAU/USD', side: 'BUY', lotSize: 0.5,
    entryPrice: 2372.1, currentPrice: 2378.42, stopLoss: 2367.1, takeProfit: 2387.1,
    pnl: 315.0, pips: 63.2, swap: -0.7, commission: -6.0, openedAt: '12:05:09',
    strategy: 'BOS Retest', mode: 'SEMI_AUTO',
  },
];

export const initialExecutionLog: ExecutionLogEntry[] = [
  {
    id: 'l1', time: '14:32:11', type: 'ORDER', message: 'BUY 0.30 XAU/USD @ 2375.40 — SMC Scalp',
    status: 'FILLED', ticket: 50421873, symbol: 'XAU/USD',
  },
  {
    id: 'l2', time: '13:18:44', type: 'ORDER', message: 'SELL 0.20 XAU/USD @ 2381.20 — Liquidity Sweep',
    status: 'FILLED', ticket: 50421874, symbol: 'XAU/USD',
  },
  {
    id: 'l3', time: '12:05:09', type: 'ORDER', message: 'BUY 0.50 XAU/USD @ 2372.10 — BOS Retest',
    status: 'FILLED', ticket: 50421875, symbol: 'XAU/USD',
  },
  {
    id: 'l4', time: '11:44:08', type: 'CLOSE', message: 'Closed #50421870 BUY 0.30 @ 2368.50 → 2377.20, P/L +$261.00',
    status: 'FILLED', ticket: 50421870, symbol: 'XAU/USD',
  },
  {
    id: 'l5', time: '10:02:41', type: 'CLOSE', message: 'Closed #50421868 SELL 0.20 @ 2384.70 → 2385.90, P/L -$24.00',
    status: 'FILLED', ticket: 50421868, symbol: 'XAU/USD',
  },
];

export const latencyHistory: number[] = [
  42, 38, 41, 45, 39, 36, 40, 44, 37, 38, 35, 41, 43, 38, 36, 40, 39, 42, 37, 38,
];
