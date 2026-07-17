import { Database, Download, HardDrive, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { type BackupSettings } from '../../data/settings';
import { SettingsSection, Field, TextInput, SelectInput, Toggle } from './SettingsControls';

interface Props {
  settings: BackupSettings;
  onChange: (v: BackupSettings) => void;
}

export function BackupSection({ settings, onChange }: Props) {
  const includes: { key: keyof BackupSettings; label: string }[] = [
    { key: 'includeTradeHistory', label: 'Trade History' },
    { key: 'includeSettings', label: 'Settings & Config' },
    { key: 'includeStrategies', label: 'Strategy Definitions' },
  ];

  return (
    <SettingsSection icon={<Database className="h-5 w-5" />} title="Backup Settings" description="Automated backup configuration and data retention" accent="bull">
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-sm text-slate-300">Automatic Backups</p>
            <p className="text-[10px] text-slate-500">Schedule recurring backups of your trading data</p>
          </div>
        </div>
        <Toggle checked={settings.autoBackup} onChange={(v) => onChange({ ...settings, autoBackup: v })} />
      </div>

      {settings.autoBackup && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in">
          <Field label="Backup Frequency">
            <SelectInput value={settings.backupFrequency}
              onChange={(e) => onChange({ ...settings, backupFrequency: e.target.value as BackupSettings['backupFrequency'] })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </SelectInput>
          </Field>
          <Field label="Backup Location">
            <div className="flex items-center gap-2.5">
              <HardDrive className="h-4 w-4 text-slate-500" />
              <TextInput value={settings.backupLocation}
                onChange={(e) => onChange({ ...settings, backupLocation: e.target.value })} />
            </div>
          </Field>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">Backup Contents</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {includes.map((inc) => (
            <div key={inc.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-2.5">
              <span className="text-sm text-slate-300">{inc.label}</span>
              <Toggle checked={settings[inc.key] as boolean} onChange={(v) => onChange({ ...settings, [inc.key]: v })} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-sm text-slate-300">Encrypt Backups</p>
            <p className="text-[10px] text-slate-500">AES-256 encryption for backup files</p>
          </div>
        </div>
        <Toggle checked={settings.encryptionEnabled} onChange={(v) => onChange({ ...settings, encryptionEnabled: v })} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-bull-500/15 bg-bull-500/[0.04] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-bull-400" />
          <div>
            <p className="text-sm text-slate-300">Last Backup</p>
            <p className="tabular text-[11px] text-slate-500">{settings.lastBackup}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10">
          <Download className="h-3.5 w-3.5" />Backup Now
        </button>
      </div>
    </SettingsSection>
  );
}
