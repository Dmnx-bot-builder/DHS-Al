import { Gauge, Activity, BarChart3, Zap } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type IndicatorData } from '../../data/strategy';

function MiniBar({ value, max, accent }: { value: number; max: number; accent: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div className={`h-full rounded-full transition-all duration-700 ${accent}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function IndicatorsCard({ indicators }: { indicators: IndicatorData }) {
  const { rsi, atr, macd, macdSignal, macdHistogram, volumeCurrent, volumeAverage, stochK, stochD } = indicators;
  const volRatio = (volumeCurrent / volumeAverage) * 100;
  const macdBullish = macdHistogram > 0;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Technical Indicators</h3>
        </div>
        <span className="text-[10px] text-slate-500">M15</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* RSI */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">RSI (14)</span>
            <span className={`tabular text-sm font-bold ${rsi > 70 ? 'text-bear-400' : rsi < 30 ? 'text-bull-400' : 'text-slate-200'}`}>{rsi.toFixed(1)}</span>
          </div>
          <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="absolute inset-y-0 left-[30%] w-px bg-bull-500/30" />
            <div className="absolute inset-y-0 left-[70%] w-px bg-bear-500/30" />
            <div className="h-full rounded-full bg-gradient-to-r from-bear-500 via-gold-500 to-bull-500" style={{ width: `${rsi}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-slate-600">
            <span>Oversold</span><span>Neutral</span><span>Overbought</span>
          </div>
        </div>

        {/* ATR */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">ATR (14)</span>
            <span className="tabular text-sm font-bold text-slate-200">{atr.toFixed(2)}</span>
          </div>
          <MiniBar value={atr} max={10} accent="bg-gradient-to-r from-gold-600 to-gold-400" />
          <p className="mt-1 text-[9px] text-slate-600">Volatility measure</p>
        </div>

        {/* MACD */}
        <div className="col-span-2 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">MACD</span>
            </div>
            <span className={`text-[10px] font-semibold ${macdBullish ? 'text-bull-400' : 'text-bear-400'}`}>{macdBullish ? 'Bullish' : 'Bearish'}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-600">MACD</p>
              <p className="tabular text-sm font-semibold text-slate-200">{macd.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-600">Signal</p>
              <p className="tabular text-sm font-semibold text-slate-300">{macdSignal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-600">Hist</p>
              <p className={`tabular text-sm font-semibold ${macdBullish ? 'text-bull-400' : 'text-bear-400'}`}>{macdHistogram > 0 ? '+' : ''}{macdHistogram.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-2 flex h-6 items-end justify-center gap-0.5">
            {[0.2, 0.3, 0.38, 0.25, 0.15].map((h, i) => (
              <div key={i} className={`w-3 rounded-t ${macdBullish ? 'bg-bull-500/60' : 'bg-bear-500/60'}`} style={{ height: `${h * 100}%` }} />
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-gold-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Volume</span>
            </div>
            <span className="text-[10px] font-semibold text-bull-400">+{Math.round(volRatio - 100)}%</span>
          </div>
          <div className="mt-2 flex h-8 items-end gap-1.5">
            <div className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${Math.min(100, (volumeCurrent / volumeAverage) * 70)}%` }} />
            <div className="flex-1 rounded-t bg-white/10" style={{ height: '50%' }} />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-slate-600">
            <span className="tabular">{volumeCurrent.toLocaleString()}</span>
            <span className="tabular">avg {volumeAverage.toLocaleString()}</span>
          </div>
        </div>

        {/* Stochastic */}
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-gold-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Stochastic</span>
            </div>
            <span className={`text-[10px] font-semibold ${stochK > 80 ? 'text-bear-400' : stochK < 20 ? 'text-bull-400' : 'text-slate-300'}`}>
              {stochK > stochD ? '↑' : '↓'}
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-4 text-[9px] text-slate-600">K</span>
              <div className="flex-1"><MiniBar value={stochK} max={100} accent="bg-brand-500" /></div>
              <span className="tabular w-8 text-right text-[10px] font-semibold text-slate-300">{stochK.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 text-[9px] text-slate-600">D</span>
              <div className="flex-1"><MiniBar value={stochD} max={100} accent="bg-gold-500" /></div>
              <span className="tabular w-8 text-right text-[10px] font-semibold text-slate-300">{stochD.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
