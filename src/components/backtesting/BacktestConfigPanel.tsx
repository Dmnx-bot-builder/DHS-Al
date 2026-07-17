import { FlaskConical, Play, Calendar, DollarSign, Settings2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import {
  type BacktestConfig, type BacktestSymbol, type BacktestTimeframe, type BacktestStrategy,
  symbolOptions, timeframeOptions, strategyOptions,
} from '../../data/backtesting';

interface Props {
  config: BacktestConfig;
  onChange: (config: BacktestConfig) => void;
  onRun: () => void;
  isRunning: boolean;
}

const inputCls = 'w-full rounded-lg border border-white/10 bg-ink-800/60 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-brand-500/50 focus:bg-ink-800/80';

export function BacktestConfigPanel({ config, onChange, onRun, isRunning }: Props) {
  const update = (patch: Partial<BacktestConfig>) => onChange({ ...config, ...patch });

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Backtest Configuration</h3>
            <p className="text-[11px] text-slate-500">Configure and run strategy backtest</p>
          </div>
        </div>
        <FlaskConical className="h-5 w-5 text-slate-600" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">Symbol</label>
          <select className={inputCls} value={config.symbol} onChange={(e) => update({ symbol: e.target.value as BacktestSymbol })}>
            {symbolOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">Timeframe</label>
          <div className="flex flex-wrap gap-1.5">
            {timeframeOptions.map((tf) => (
              <button key={tf} onClick={() => update({ timeframe: tf as BacktestTimeframe })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${config.timeframe === tf ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/40' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">Strategy</label>
          <select className={inputCls} value={config.strategy} onChange={(e) => update({ strategy: e.target.value as BacktestStrategy })}>
            {strategyOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Calendar className="h-3 w-3" />Start Date</label>
          <input type="date" className={inputCls} value={config.startDate} onChange={(e) => update({ startDate: e.target.value })} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Calendar className="h-3 w-3" />End Date</label>
          <input type="date" className={inputCls} value={config.endDate} onChange={(e) => update({ endDate: e.target.value })} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><DollarSign className="h-3 w-3" />Initial Balance</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
            <input type="number" className={`${inputCls} pl-7`} value={config.initialBalance}
              onChange={(e) => update({ initialBalance: Math.max(100, Number(e.target.value)) })} />
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">Risk Per Trade (%)</label>
          <div className="flex items-center gap-3">
            <input type="range" min={0.5} max={5} step={0.5} value={config.riskPerTrade}
              onChange={(e) => update({ riskPerTrade: Number(e.target.value) })}
              className="flex-1 accent-brand-500" />
            <span className="tabular w-10 text-right text-sm font-semibold text-brand-300">{config.riskPerTrade}%</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="flex h-2 w-2 rounded-full bg-bull-400" />
          <span>Ready to backtest {config.symbol} · {config.timeframe} · {config.strategy}</span>
        </div>
        <button onClick={onRun} disabled={isRunning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-50">
          {isRunning ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Running...</>
          ) : (
            <><Play className="h-4 w-4" />Start Backtest</>
          )}
        </button>
      </div>
    </GlassCard>
  );
}
