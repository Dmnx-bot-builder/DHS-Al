// App-wide constants — API endpoints, storage keys, limits, defaults

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'dhs_access_token',
  REFRESH_TOKEN: 'dhs_refresh_token',
  TOKEN_EXPIRY: 'dhs_token_expiry',
  USER: 'dhs_user',
  SETTINGS: 'dhs_settings',
} as const;

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    enable2FA: '/auth/2fa/enable',
    disable2FA: '/auth/2fa/disable',
    status2FA: '/auth/2fa/status',
  },
  account: {
    info: '/account/info',
    broker: '/account/broker',
    connectBroker: '/account/broker/connect',
    disconnectBroker: '/account/broker/disconnect',
    summary: '/account/summary',
  },
  market: {
    quote: '/market/quote',
    quotes: '/market/quotes',
    watchlist: '/market/watchlist',
    candles: '/market/candles',
    news: '/market/news',
    status: '/market/status',
  },
  signals: {
    current: '/signals/current',
    history: '/signals/history',
    latest: '/signals/latest',
  },
  execution: {
    positions: '/execution/positions',
    log: '/execution/log',
    settings: '/execution/settings',
    order: '/execution/order',
    close: '/execution/close',
    closeAll: '/execution/close-all',
  },
  history: {
    trades: '/history/trades',
    stats: '/history/stats',
    monthlyPnl: '/history/monthly-pnl',
    strategyStats: '/history/strategy-stats',
    export: '/history/export',
  },
  backtest: {
    run: '/backtest/run',
    byId: '/backtest',
    history: '/backtest/history',
    strategies: '/backtest/strategies',
    symbols: '/backtest/symbols',
  },
  settings: {
    base: '/settings',
  },
} as const;

export const DEFAULTS = {
  initialBalance: 10000,
  riskPerTrade: 2,
  refetchInterval: 5000,
  chartHeight: 260,
  pageSize: 15,
} as const;

export const PIP_SIZES: Record<string, number> = {
  'XAU/USD': 0.1,
  'USD/JPY': 0.01,
  'EUR/USD': 0.0001,
  'GBP/USD': 0.0001,
  'BTC/USD': 1,
  'WTI/USD': 0.01,
};
