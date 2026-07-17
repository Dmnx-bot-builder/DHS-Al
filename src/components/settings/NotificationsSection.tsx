import { BellRing, Mail, Send, Monitor } from 'lucide-react';
import { type NotificationSettings } from '../../data/settings';
import { SettingsSection, Field, TextInput, Toggle } from './SettingsControls';

interface Props {
  settings: NotificationSettings;
  onChange: (v: NotificationSettings) => void;
}

export function NotificationsSection({ settings, onChange }: Props) {
  const alerts: { key: keyof NotificationSettings; label: string }[] = [
    { key: 'alertOnTradeOpen', label: 'Trade Opened' },
    { key: 'alertOnTradeClose', label: 'Trade Closed' },
    { key: 'alertOnStopLoss', label: 'Stop Loss Hit' },
    { key: 'alertOnTakeProfit', label: 'Take Profit Hit' },
    { key: 'alertOnDailyLoss', label: 'Daily Loss Limit Reached' },
  ];

  return (
    <SettingsSection icon={<BellRing className="h-5 w-5" />} title="Notifications" description="Configure how and when you receive alerts" accent="gold">
      <div className="space-y-3">
        <ChannelRow icon={<Mail className="h-4 w-4" />} title="Email Alerts" desc="Receive notifications via email"
          checked={settings.emailAlerts} onToggle={(v) => onChange({ ...settings, emailAlerts: v })}>
          <Field label="Email Address">
            <TextInput type="email" value={settings.emailAddress} disabled={!settings.emailAlerts}
              onChange={(e) => onChange({ ...settings, emailAddress: e.target.value })} placeholder="you@example.com" />
          </Field>
        </ChannelRow>

        <ChannelRow icon={<Send className="h-4 w-4" />} title="Telegram Alerts" desc="Get instant alerts via Telegram bot"
          checked={settings.telegramAlerts} onToggle={(v) => onChange({ ...settings, telegramAlerts: v })}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Bot Token">
              <TextInput value={settings.telegramBotToken} disabled={!settings.telegramAlerts}
                onChange={(e) => onChange({ ...settings, telegramBotToken: e.target.value })} placeholder="123456:ABC-DEF..." />
            </Field>
            <Field label="Chat ID">
              <TextInput value={settings.telegramChatId} disabled={!settings.telegramAlerts}
                onChange={(e) => onChange({ ...settings, telegramChatId: e.target.value })} placeholder="123456789" />
            </Field>
          </div>
        </ChannelRow>

        <ChannelRow icon={<Monitor className="h-4 w-4" />} title="Desktop Notifications" desc="Browser push notifications"
          checked={settings.desktopNotifications} onToggle={(v) => onChange({ ...settings, desktopNotifications: v })} />
      </div>

      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">Alert Triggers</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((a) => (
            <div key={a.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-2.5">
              <span className="text-sm text-slate-300">{a.label}</span>
              <Toggle checked={settings[a.key] as boolean} onChange={(v) => onChange({ ...settings, [a.key]: v })} />
            </div>
          ))}
        </div>
      </div>
    </SettingsSection>
  );
}

function ChannelRow({ icon, title, desc, checked, onToggle, children }: {
  icon: React.ReactNode; title: string; desc: string; checked: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-slate-500">{icon}</span>
          <div>
            <p className="text-sm text-slate-300">{title}</p>
            <p className="text-[10px] text-slate-500">{desc}</p>
          </div>
        </div>
        <Toggle checked={checked} onChange={onToggle} />
      </div>
      {checked && children && <div className="mt-3 border-t border-white/5 pt-3 animate-fade-in">{children}</div>}
    </div>
  );
}
