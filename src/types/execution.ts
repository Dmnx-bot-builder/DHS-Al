// Trade execution API types

export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'FILLED' | 'PARTIAL' | 'REJECTED' | 'CANCELLED';
export type TradingMode = 'MANUAL' | 'SEMI_AUTO' | 'FULL_AUTO';
export type TradingEngine = 'MT5' | 'CTRADER' | 'BROKER_API';

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
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  maxDailyLoss: number;
  maxTrades: number;
  maxConsecutiveLosses: number;
}

export interface ExecuteOrderRequest {
  symbol: string;
  side: OrderSide;
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
  mode: TradingMode;
}

export interface ExecuteOrderResponse {
  ticket: number;
  status: OrderStatus;
  message: string;
  executedAt: string;
}

export interface ClosePositionRequest {
  ticket: number;
}

export interface CloseAllResponse {
  closed: number;
  totalPnl: number;
  message: string;
}

export interface UpdateSettingsRequest {
  lotSize?: number;
  riskPct?: number;
  stopLoss?: number;
  takeProfit?: number;
  maxDailyLoss?: number;
  maxTrades?: number;
  maxConsecutiveLosses?: number;
}
