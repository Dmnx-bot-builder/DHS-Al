// Settings service — get/update all settings sections

import { apiGet, apiPut } from './apiClient';
import type { AllSettings, SettingsSection, BrokerSettings, ApiConfig, TradingSettings as TradingSettingsType, NotificationSettings, AppearanceSettings, SecuritySettings, BackupSettings } from '../types';

export const settingsService = {
  getAll: () =>
    apiGet<AllSettings>('/settings'),

  updateSection: <K extends SettingsSection>(section: K, data: AllSettings[K]) =>
    apiPut<AllSettings[K]>(`/settings/${section}`, data),

  getBroker: () =>
    apiGet<BrokerSettings>('/settings/broker'),

  updateBroker: (data: BrokerSettings) =>
    apiPut<BrokerSettings>('/settings/broker', data),

  getApi: () =>
    apiGet<ApiConfig>('/settings/api'),

  updateApi: (data: ApiConfig) =>
    apiPut<ApiConfig>('/settings/api', data),

  getTrading: () =>
    apiGet<TradingSettingsType>('/settings/trading'),

  updateTrading: (data: TradingSettingsType) =>
    apiPut<TradingSettingsType>('/settings/trading', data),

  getNotifications: () =>
    apiGet<NotificationSettings>('/settings/notifications'),

  updateNotifications: (data: NotificationSettings) =>
    apiPut<NotificationSettings>('/settings/notifications', data),

  getAppearance: () =>
    apiGet<AppearanceSettings>('/settings/appearance'),

  updateAppearance: (data: AppearanceSettings) =>
    apiPut<AppearanceSettings>('/settings/appearance', data),

  getSecurity: () =>
    apiGet<SecuritySettings>('/settings/security'),

  updateSecurity: (data: SecuritySettings) =>
    apiPut<SecuritySettings>('/settings/security', data),

  getBackup: () =>
    apiGet<BackupSettings>('/settings/backup'),

  updateBackup: (data: BackupSettings) =>
    apiPut<BackupSettings>('/settings/backup', data),
};
