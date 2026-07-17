import { Palette, Moon, Globe, BarChart3 } from 'lucide-react';
import { type AppearanceSettings, languages, themeColors } from '../../data/settings';
import { SettingsSection, Field, SelectInput, Toggle } from './SettingsControls';

interface Props {
  settings: AppearanceSettings;
  onChange: (v: AppearanceSettings) => void;
}

export function AppearanceSection({ settings, onChange }: Props) {
  return (
    <SettingsSection icon={<Palette className="h-5 w-5" />} title="Appearance" description="Customize the look and feel of your terminal" accent="brand">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Moon className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm text-slate-300">Dark Mode</p>
              <p className="text-[10px] text-slate-500">Use dark color scheme throughout the interface</p>
            </div>
          </div>
          <Toggle checked={settings.darkMode} onChange={(v) => onChange({ ...settings, darkMode: v })} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm text-slate-300">Compact Mode</p>
              <p className="text-[10px] text-slate-500">Reduce spacing for denser information display</p>
            </div>
          </div>
          <Toggle checked={settings.compactMode} onChange={(v) => onChange({ ...settings, compactMode: v })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Language">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <SelectInput className="pl-9" value={settings.language}
                onChange={(e) => onChange({ ...settings, language: e.target.value as AppearanceSettings['language'] })}>
                {languages.map((l) => <option key={l.value} value={l.value}>{l.flag} · {l.label}</option>)}
              </SelectInput>
            </div>
          </Field>

          <Field label="Chart Type">
            <SelectInput value={settings.chartType}
              onChange={(e) => onChange({ ...settings, chartType: e.target.value as AppearanceSettings['chartType'] })}>
              <option value="candles">Candlesticks</option>
              <option value="bars">OHLC Bars</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
            </SelectInput>
          </Field>
        </div>

        <Field label="Theme Color" hint="Primary accent color for buttons, highlights, and active states">
          <div className="flex flex-wrap gap-3">
            {themeColors.map((c) => (
              <button key={c.value} onClick={() => onChange({ ...settings, themeColor: c.value })}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${settings.themeColor === c.value ? 'border-white/20 bg-white/5' : 'border-white/5 hover:bg-white/5'}`}>
                <span className="h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-ink-800" style={{ backgroundColor: c.color, ...(settings.themeColor === c.value ? { boxShadow: `0 0 0 2px ${c.color}` } : {}) }} />
                <span className={`text-xs ${settings.themeColor === c.value ? 'text-white' : 'text-slate-400'}`}>{c.label}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>
    </SettingsSection>
  );
}
