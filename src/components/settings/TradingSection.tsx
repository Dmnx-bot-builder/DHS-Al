import { SlidersHorizontal, Shield, Clock } from 'lucide-react';
import { type TradingSettings, sessions } from '../../data/settings';
import { SettingsSection, Field, TextInput, SelectInput, Toggle } from './SettingsControls';

interface Props {
  settings: TradingSettings;
  onChange: (v: TradingSettings) => void;
}

export function TradingSection({ settings, onChange }: Props) {
  return (
    <SettingsSection icon={<SlidersHorizontal className="h-5 w-5" />} title="Trading Settings" description="Risk management and execution defaults" accent="bull">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Risk Per Trade (%)">
          <div className="flex items-center gap-3">
            <input type="range" min={0.5} max={5} step={0.5} value={settings.riskPercent}
              onChange={(e) => onChange({ ...settings, riskPercent: Number(e.target.value) })}
              className="flex-1 accent-brand-500" />
            <span className="tabular w-10 text-right text-sm font-semibold text-brand-300">{settings.riskPercent}%</span>
          </div>
        </Field>

        <Field label="Default Lot Size">
          <TextInput type="number" step={0.01} min={0.01} value={settings.defaultLot}
            onChange={(e) => onChange({ ...settings, defaultLot: Number(e.target.value) })} />
        </Field>

        <Field label="Max Daily Loss ($)">
          <TextInput type="number" value={settings.maxDailyLoss}
            onChange={(e) => onChange({ ...settings, maxDailyLoss: Number(e.target.value) })} />
        </Field>

        <Field label="Max Trades">
          <TextInput type="number" value={settings.maxTrades}
            onChange={(e) => onChange({ ...settings, maxTrades: Number(e.target.value) })} />
        </Field>

        <Field label="Max Consecutive Losses">
          <TextInput type="number" value={settings.maxConsecutiveLosses}
            onChange={(e) => onChange({ ...settings, maxConsecutiveLosses: Number(e.target.value) })} />
        </Field>

        <Field label="Trading Session">
          <div className="relative">
            <SelectInput value={settings.tradingSession}
              onChange={(e) => onChange({ ...settings, tradingSession: e.target.value as TradingSettings['tradingSession'] })}>
              {sessions.map((s) => <option key={s.value} value={s.value}>{s.label} · {s.time}</option>)}
            </SelectInput>
          </div>
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm text-slate-300">Auto Trading</p>
              <p className="text-[10px] text-slate-500">Allow AI engine to execute trades automatically</p>
            </div>
          </div>
          <Toggle checked={settings.autoTrading} onChange={(v) => onChange({ ...settings, autoTrading: v })} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm text-slate-300">Trailing Stop</p>
              <p className="text-[10px] text-slate-500">Automatically adjust stop loss as price moves favorably</p>
            </div>
          </div>
          <Toggle checked={settings.trailingStop} onChange={(v) => onChange({ ...settings, trailingStop: v })} />
        </div>

        {settings.trailingStop && (
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3 pl-12 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-300">Trailing distance (pips)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onChange({ ...settings, trailingStopPips: Math.max(1, settings.trailingStopPips - 1) })}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">-</button>
              <span className="tabular w-12 text-center text-sm font-semibold text-brand-300">{settings.trailingStopPips}</span>
              <button onClick={() => onChange({ ...settings, trailingStopPips: settings.trailingStopPips + 1 })}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">+</button>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
