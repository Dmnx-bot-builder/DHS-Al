// Account API types

export interface AccountInfo {
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
  currency: string;
  leverage: string;
  server: string;
}

export interface BrokerConnectionInfo {
  name: string;
  server: string;
  login: string;
  connected: boolean;
  latencyMs: number;
  leverage: string;
  currency: string;
}

export interface ConnectBrokerRequest {
  login: string;
  password: string;
  server: string;
}

export interface AccountSummary {
  accountInfo: AccountInfo;
  broker: BrokerConnectionInfo;
  serverTime: string;
  timezone: string;
}
