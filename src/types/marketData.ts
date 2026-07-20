// Modular Market Data Service types

import type { Timeframe } from './market';

export type MarketDataMode = 'LIVE' | 'MOCK';

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

export type ApiHealth = 'VALID' | 'INVALID' | 'MISSING' | 'RATE_LIMITED' | 'UNKNOWN';

export type ReconnectStatus = 'IDLE' | 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';

export type ProviderName = 'mock' | 'twelvedata' | 'polygon' | 'finnhub' | 'alphavantage';

export type ApiKeySource = 'local' | 'env' | 'none';

export type MockReason =
  | 'NO_API_KEY'
  | 'INVALID_API_KEY'
  | 'NETWORK_TIMEOUT'
  | 'RATE_LIMIT'
  | 'PROVIDER_UNAVAILABLE'
  | 'INIT_FAILURE'
  | 'UNKNOWN_ERROR'
  | null;

export type PollingStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED';

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
  lastLiveUpdate: number | null;
  lastSuccessfulLiveRequest: number | null;
  lastFailedRequest: number | null;
  error: string | null;
  errorReason: ErrorReason | null;
  apiHealth: ApiHealth;
  reconnectStatus: ReconnectStatus;
  reconnectAttempts: number;
  autoRefreshEnabled: boolean;
  pollingStatus: PollingStatus;
  apiKeySource: ApiKeySource;
  maskedApiKey: string | null;
  consecutiveFailures: number;
  mockReason: MockReason;
  mockReasonMessage: string | null;
}

export interface ErrorReason {
  code: 'API_KEY_MISSING' | 'INVALID_API_KEY' | 'RATE_LIMIT_REACHED' | 'NETWORK_LOST' | 'PROVIDER_UNAVAILABLE' | 'AUTH_FAILED' | 'UNKNOWN';
  message: string;
  suggestedAction: string;
}

export interface MarketDataProvider {
  readonly name: ProviderName;
  readonly label: string;
  readonly isLive: boolean;
  fetchCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<OhlcCandle[]>;
  fetchQuote(symbol: string): Promise<LiveQuote>;
}
