import { useState, useMemo } from 'react';
import { Settings, ChevronRight, Wifi, SlidersHorizontal, BellRing, Palette, Lock, Database } from 'lucide-react';
import { BrokerSection } from '../components/settings/BrokerSection';
import { TradingSection } from '../components/settings/TradingSection';
import { NotificationsSection } from '../components/settings/NotificationsSection';
import { AppearanceSection } from '../components/settings/AppearanceSection';
import { SecuritySection } from '../components/settings/SecuritySection';
import { BackupSection } from '../components/settings/BackupSection';
import { SaveBar } from '../components/settings/SettingsControls';
import {
  type BrokerSettings, type ApiConfig, type TradingSettings,
  type NotificationSettings, type AppearanceSettings, type SecuritySettings, type BackupSettings,
  defaultBroker, defaultApi, defaultTrading, defaultNotifications,
  defaultAppearance, defaultSecurity, defaultBackup,
} from '../data/settings';

type TabId = 'broker' | 'trading' | 'notifications' | 'appearance' | 'security' | 'backup';

const tabs: { id: TabId; label: string; icon: typeof Wifi }[] = [
  { id: 'broker', label: 'Broker & API', icon: Wifi },
  { id: 'trading', label: 'Trading', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'backup', label: 'Backup', icon: Database },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('broker');
  const [broker, setBroker] = useState<BrokerSettings>(defaultBroker);
  const [api, setApi] = useState<ApiConfig>(defaultApi);
  const [trading, setTrading] = useState<TradingSettings>(defaultTrading);
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [security, setSecurity] = useState<SecuritySettings>(defaultSecurity);
  const [backup, setBackup] = useState<BackupSettings>(defaultBackup);
  const [saved, setSaved] = useState(false);

  const dirty = useMemo(() => {
    return (
      JSON.stringify(broker) !== JSON.stringify(defaultBroker) ||
      JSON.stringify(api) !== JSON.stringify(defaultApi) ||
      JSON.stringify(trading) !== JSON.stringify(defaultTrading) ||
      JSON.stringify(notifications) !== JSON.stringify(defaultNotifications) ||
      JSON.stringify(appearance) !== JSON.stringify(defaultAppearance) ||
      JSON.stringify(security) !== JSON.stringify(defaultSecurity) ||
      JSON.stringify(backup) !== JSON.stringify(defaultBackup)
    );
  }, [broker, api, trading, notifications, appearance, security, backup]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setBroker(defaultBroker);
    setApi(defaultApi);
    setTrading(defaultTrading);
    setNotifications(defaultNotifications);
    setAppearance(defaultAppearance);
    setSecurity(defaultSecurity);
    setBackup(defaultBackup);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span>System</span><ChevronRight className="h-3 w-3" /><span className="text-slate-300">Settings</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>
            <p className="text-xs text-slate-500">Manage your account, trading, and system preferences</p>
          </div>
        </div>
        <button onClick={handleReset}
          className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200">
          Reset to Defaults
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-52 lg:shrink-0">
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.06] bg-ink-800/40 p-2 lg:flex-col lg:overflow-visible">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-brand-500/10 text-white ring-1 ring-brand-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-brand-300' : ''}`} />
                  <span className="whitespace-nowrap lg:whitespace-normal">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {activeTab === 'broker' && (
            <BrokerSection broker={broker} api={api} onBrokerChange={setBroker} onApiChange={setApi} />
          )}
          {activeTab === 'trading' && (
            <TradingSection settings={trading} onChange={setTrading} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsSection settings={notifications} onChange={setNotifications} />
          )}
          {activeTab === 'appearance' && (
            <AppearanceSection settings={appearance} onChange={setAppearance} />
          )}
          {activeTab === 'security' && (
            <SecuritySection settings={security} onChange={setSecurity} />
          )}
          {activeTab === 'backup' && (
            <BackupSection settings={backup} onChange={setBackup} />
          )}
        </div>
      </div>

      <SaveBar onSave={handleSave} saved={saved} dirty={dirty} />
    </div>
  );
}
