// Settings hook — wraps settingsService for React components

import { useApi } from './useApi';
import { useMutation } from './useMutation';
import { settingsService } from '../services/settingsService';
import type { SettingsSection, AllSettings } from '../types';

export function useAllSettings() {
  return useApi(() => settingsService.getAll(), []);
}

type SectionUpdateArgs = { section: SettingsSection; data: AllSettings[SettingsSection] };

export function useUpdateSettingsSection() {
  return useMutation(
    (args: SectionUpdateArgs) => settingsService.updateSection(args.section, args.data),
  );
}

export function useUpdateBroker() {
  return useMutation((data: AllSettings['broker']) => settingsService.updateBroker(data));
}

export function useUpdateTradingSettings() {
  return useMutation((data: AllSettings['trading']) => settingsService.updateTrading(data));
}

export function useUpdateNotifications() {
  return useMutation((data: AllSettings['notifications']) => settingsService.updateNotifications(data));
}

export function useUpdateAppearance() {
  return useMutation((data: AllSettings['appearance']) => settingsService.updateAppearance(data));
}

export function useUpdateSecurity() {
  return useMutation((data: AllSettings['security']) => settingsService.updateSecurity(data));
}

export function useUpdateBackup() {
  return useMutation((data: AllSettings['backup']) => settingsService.updateBackup(data));
}
