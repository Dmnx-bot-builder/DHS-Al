import { Wifi, KeyRound, Link2 } from 'lucide-react';
import { type BrokerSettings, type ApiConfig } from '../../data/settings';
import { SettingsSection, Field, TextInput, Toggle } from './SettingsControls';
import { Badge } from '../ui/GlassCard';

interface Props {
  broker: BrokerSettings;
  api: ApiConfig;
  onBrokerChange: (v: BrokerSettings) => void;
  onApiChange: (v: ApiConfig) => void;
}

export function BrokerSection({ broker, api, onBrokerChange, onApiChange }: Props) {
  return (
    <>
      <SettingsSection icon={<Wifi className="h-5 w-5" />} title="Broker Settings" description="MetaTrader 5 connection credentials" accent="brand">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="MT5 Login">
            <TextInput value={broker.mt5Login} onChange={(e) => onBrokerChange({ ...broker, mt5Login: e.target.value })} placeholder="Enter MT5 login ID" />
          </Field>
          <Field label="Server">
            <TextInput value={broker.server} onChange={(e) => onBrokerChange({ ...broker, server: e.target.value })} placeholder="Broker server name" />
          </Field>
          <Field label="Password">
            <TextInput type="password" value={broker.password} onChange={(e) => onBrokerChange({ ...broker, password: e.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="Investor Password" hint="Read-only access (optional)">
            <TextInput type="password" value={broker.investorPassword} onChange={(e) => onBrokerChange({ ...broker, investorPassword: e.target.value })} placeholder="••••••••" />
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${broker.connected ? 'bg-bull-400' : 'bg-bear-400'} ${broker.connected ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-slate-300">
              {broker.connected ? 'Connected to ' : 'Disconnected from '}<span className="font-medium text-white">{broker.server}</span>
            </span>
          </div>
          <Badge variant={broker.connected ? 'success' : 'danger'} dot>{broker.connected ? 'ONLINE' : 'OFFLINE'}</Badge>
        </div>
      </SettingsSection>

      <SettingsSection icon={<KeyRound className="h-5 w-5" />} title="API Configuration" description="External API access and webhooks" accent="gold">
        <div className="mb-4 flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Link2 className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-300">Enable API access for external integrations</span>
          </div>
          <Toggle checked={api.enabled} onChange={(v) => onApiChange({ ...api, enabled: v })} />
        </div>
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${!api.enabled ? 'pointer-events-none opacity-40' : ''}`}>
          <Field label="API Key">
            <TextInput value={api.apiKey} onChange={(e) => onApiChange({ ...api, apiKey: e.target.value })} placeholder="Enter your API key" />
          </Field>
          <Field label="API Secret">
            <TextInput type="password" value={api.apiSecret} onChange={(e) => onApiChange({ ...api, apiSecret: e.target.value })} placeholder="••••••••••••" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Webhook URL" hint="Endpoint for receiving trade signals">
              <TextInput value={api.webhookUrl} onChange={(e) => onApiChange({ ...api, webhookUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </div>
        </div>
        {api.enabled && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-gold-500/15 bg-gold-500/[0.04] px-4 py-2.5 text-xs text-gold-400">
            <KeyRound className="h-3.5 w-3.5" />
            <span>API is active. Keep your credentials secure and never share them.</span>
          </div>
        )}
      </SettingsSection>
    </>
  );
}
