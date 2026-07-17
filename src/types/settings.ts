// Settings API types

export interface BrokerSettings {
  mt5Login: string;
  server: string;
  password: string;
  investorPassword: string;
  connected: boolean;
}

export interface ApiConfig {
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  enabled: boolean;
}

export interface TradingSettings {
  riskPercent: number;
  defaultLot: number;
  maxDailyLoss: number;
  maxTrades: number;
  maxConsecutiveLosses: number;
  tradingSession: 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'OVERLAP' | '24_HOURS';
  autoTrading: boolean;
  trailingStop: boolean;
  trailingStopPips: number;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  emailAddress: string;
  telegramAlerts: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  desktopNotifications: boolean;
  alertOnTradeOpen: boolean;
  alertOnTradeClose: boolean;
  alertOnStopLoss: boolean;
  alertOnTakeProfit: boolean;
  alertOnDailyLoss: boolean;
}

export interface AppearanceSettings {
  darkMode: boolean;
  language: 'en' | 'es' | 'de' | 'fr' | 'ar' | 'zh';
  themeColor: 'brand' | 'gold' | 'bull' | 'bear' | 'cyan' | 'rose';
  compactMode: boolean;
  chartType: 'candles' | 'bars' | 'line' | 'area';
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  ipWhitelist: string;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackup: string;
  backupLocation: string;
  includeTradeHistory: boolean;
  includeSettings: boolean;
  includeStrategies: boolean;
  encryptionEnabled: boolean;
}

export interface AllSettings {
  broker: BrokerSettings;
  api: ApiConfig;
  trading: TradingSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
  backup: BackupSettings;
}

export type SettingsSection = keyof AllSettings;
