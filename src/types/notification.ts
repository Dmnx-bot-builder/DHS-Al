// DHS AI Notification system types

export type NotificationCategory =
  | 'TRADE_SIGNAL'
  | 'TRADE_UPDATE'
  | 'MARKET_ALERT'
  | 'SYSTEM';

export type NotificationSubtype =
  | 'BUY_SIGNAL'
  | 'SELL_SIGNAL'
  | 'NO_TRADE_SIGNAL'
  | 'TAKE_PROFIT'
  | 'STOP_LOSS'
  | 'TRADE_INVALIDATED'
  | 'TRADE_CLOSED'
  | 'RISK_WARNING'
  | 'HIGH_IMPACT_NEWS'
  | 'MARKET_OPEN'
  | 'MARKET_CLOSE'
  | 'HIGH_VOLATILITY'
  | 'LIQUIDITY_SWEEP'
  | 'NEW_BOS'
  | 'NEW_CHOCH'
  | 'LIVE_CONNECTED'
  | 'LIVE_DISCONNECTED'
  | 'API_KEY_MISSING'
  | 'BROKER_CONNECTED'
  | 'BROKER_DISCONNECTED'
  | 'SETTINGS_UPDATED'
  | 'VERSION_UPDATED'
  | 'API_KEY_SAVED'
  | 'API_KEY_UPDATED'
  | 'API_KEY_REMOVED'
  | 'API_KEY_INVALID'
  | 'AUTO_RECONNECT_SUCCESS'
  | 'SWITCHED_TO_MOCK'
  | 'RETURNED_TO_LIVE';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  subtype: NotificationSubtype;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  meta?: Record<string, string | number | boolean>;
}

export interface NotificationInput {
  category: NotificationCategory;
  subtype: NotificationSubtype;
  title: string;
  description: string;
  meta?: Record<string, string | number | boolean>;
}
