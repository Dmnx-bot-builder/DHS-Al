import { Plus, Minus, Settings, Shield } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type TradeSettings } from '../../data/execution';

interface TradeSettingsPanelProps {
  settings: TradeSettings;
  onChange: (settings: TradeSettings) => void;
  accountBalance: number;
}

function NumberField({ label, value, unit, step, min, max, onChange, decimals = 0 }: {
  label: string; value: number; unit?: string; step: number; min: number; max: number;
  onChange: (v: number) => void; decimals?: number;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
        {unit && <span className="text-[10px] text-slate-600">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button onClick={() => onChange(clamp(parseFloat((value - step).toFixed(decimals))))}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input type="number" value={value} step={step} min={min} max={max}
          onChange={(e) => onChange(clamp(parseFloat(e.target.value) || min))}
          className="tabular w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm font-semibold text-slate-200 outline-none focus:border-brand-500/40" />
        <button onClick={() => onChange(clamp(parseFloat((value + step).toFixed(decimals))))}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function TradeSettingsPanel({ settings, onChange, accountBalance }: TradeSettingsPanelProps) {
  const update = (key: keyof TradeSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    if (key === 'stopLoss' || key === 'takeProfit') {
      newSettings.riskRewardRatio = settings.stopLoss > 0 ? parseFloat((settings.takeProfit / settings.stopLoss).toFixed(2)) : 0;
    }
    onChange(newSettings);
  };

  const riskAmount = (accountBalance * settings.riskPct) / 100;
  const pipValue = settings.lotSize * 10; // approximate for XAU/USD
  const potentialLoss = settings.stopLoss * pipValue;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gold-400" />
          <h3 className="text-sm font-semibold text-white">Trade Settings</h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <NumberField label="Lot Size" value={settings.lotSize} step={0.05} min={0.01} max={5} decimals={2} onChange={(v) => update('lotSize', v)} />
        <NumberField label="Risk %" value={settings.riskPct} unit="%" step={0.5} min={0.5} max={10} decimals={1} onChange={(v) => update('riskPct', v)} />
        <NumberField label="Stop Loss" value={settings.stopLoss} unit="pips" step={1} min={1} max={200} onChange={(v) => update('stopLoss', v)} />
        <NumberField label="Take Profit" value={settings.takeProfit} unit="pips" step={1} min={1} max={500} onChange={(v) => update('takeProfit', v)} />
        <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">R/R Ratio</span>
            <span className="text-[10px] text-gold-400">auto</span>
          </div>
          <p className="tabular mt-2 text-center text-lg font-bold text-gold-400">{settings.riskRewardRatio.toFixed(2)}</p>
        </div>
        <NumberField label="Max Daily Loss" value={settings.maxDailyLoss} unit="$" step={50} min={50} max={5000} onChange={(v) => update('maxDailyLoss', v)} />
        <NumberField label="Max Trades" value={settings.maxTrades} step={1} min={1} max={50} onChange={(v) => update('maxTrades', v)} />
        <NumberField label="Max Cons. Loss" value={settings.maxConsecutiveLosses} step={1} min={1} max={20} onChange={(v) => update('maxConsecutiveLosses', v)} />
      </div>

      {/* Risk summary */}
      <div className="mt-4 rounded-xl border border-white/[0.06] bg-ink-800/40 p-3">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-bear-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Risk Summary</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Risk Amount</p>
            <p className="tabular mt-0.5 text-sm font-bold text-bear-400">${riskAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Potential Loss</p>
            <p className="tabular mt-0.5 text-sm font-bold text-bear-400">${potentialLoss.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Pip Value</p>
            <p className="tabular mt-0.5 text-sm font-bold text-slate-300">${pipValue.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}