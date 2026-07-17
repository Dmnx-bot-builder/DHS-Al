// Settings data layer for DHS AI terminal

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

export const defaultBroker: BrokerSettings = {
  mt5Login: '504218803',
  server: 'ICMarketsSC-Demo',
  password: '',
  investorPassword: '',
  connected: true,
};

export const defaultApi: ApiConfig = {
  apiKey: '',
  apiSecret: '',
  webhookUrl: 'https://api.dhs-ai.com/v1/webhook',
  enabled: false,
};

export const defaultTrading: TradingSettings = {
  riskPercent: 2,
  defaultLot: 0.30,
  maxDailyLoss: 500,
  maxTrades: 10,
  maxConsecutiveLosses: 5,
  tradingSession: 'OVERLAP',
  autoTrading: false,
  trailingStop: true,
  trailingStopPips: 15,
};

export const defaultNotifications: NotificationSettings = {
  emailAlerts: false,
  emailAddress: 'trader@dhs-ai.com',
  telegramAlerts: false,
  telegramBotToken: '',
  telegramChatId: '',
  desktopNotifications: true,
  alertOnTradeOpen: true,
  alertOnTradeClose: true,
  alertOnStopLoss: true,
  alertOnTakeProfit: false,
  alertOnDailyLoss: true,
};

export const defaultAppearance: AppearanceSettings = {
  darkMode: true,
  language: 'en',
  themeColor: 'brand',
  compactMode: false,
  chartType: 'candles',
};

export const defaultSecurity: SecuritySettings = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorEnabled: false,
  sessionTimeout: 30,
  ipWhitelist: '',
};

export const defaultBackup: BackupSettings = {
  autoBackup: true,
  backupFrequency: 'weekly',
  lastBackup: '2024-07-14 03:00:22',
  backupLocation: '/backups/dhs-ai/',
  includeTradeHistory: true,
  includeSettings: true,
  includeStrategies: true,
  encryptionEnabled: true,
};

export const languages: { value: AppearanceSettings['language']; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: 'EN' },
  { value: 'es', label: 'Spanish', flag: 'ES' },
  { value: 'de', label: 'German', flag: 'DE' },
  { value: 'fr', label: 'French', flag: 'FR' },
  { value: 'ar', label: 'Arabic', flag: 'AR' },
  { value: 'zh', label: 'Chinese', flag: 'ZH' },
];

export const themeColors: { value: AppearanceSettings['themeColor']; label: string; color: string }[] = [
  { value: 'brand', label: 'Electric Blue', color: '#3b82f6' },
  { value: 'gold', label: 'Gold', color: '#eab308' },
  { value: 'bull', label: 'Bull Green', color: '#22c55e' },
  { value: 'bear', label: 'Bear Red', color: '#ef4444' },
  { value: 'cyan', label: 'Cyan', color: '#06b6d4' },
  { value: 'rose', label: 'Rose', color: '#f43f5e' },
];

export const sessions: { value: TradingSettings['tradingSession']; label: string; time: string }[] = [
  { value: 'ASIAN', label: 'Asian', time: '00:00 - 09:00 UTC' },
  { value: 'LONDON', label: 'London', time: '08:00 - 17:00 UTC' },
  { value: 'NEW_YORK', label: 'New York', time: '13:00 - 22:00 UTC' },
  { value: 'OVERLAP', label: 'London/NY Overlap', time: '13:00 - 17:00 UTC' },
  { value: '24_HOURS', label: '24 Hours', time: 'All day' },
];
