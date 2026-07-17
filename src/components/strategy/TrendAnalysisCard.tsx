import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type TrendAnalysis, type TrendDirection } from '../../data/strategy';

const dirConfig: Record<TrendDirection, { label: string; text: string; bg: string; border: string; icon: typeof TrendingUp }> = {
  BULLISH: { label: 'Bullish', text: 'text-bull-400', bg: 'bg-bull-500/10', border: 'border-bull-500/30', icon: TrendingUp },
  BEARISH: { label: 'Bearish', text: 'text-bear-400', bg: 'bg-bear-500/10', border: 'border-bear-500/30', icon: TrendingDown },
  NEUTRAL: { label: 'Neutral', text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', icon: Minus },
};

export function TrendAnalysisCard({ trend, entryPrice }: { trend: TrendAnalysis; entryPrice: number }) {
  const cfg = dirConfig[trend.direction];
  const DirIcon = cfg.icon;
  const spreadPct = Math.min(100, (trend.spread / 2) * 100);
  const priceAboveEma50 = entryPrice > trend.ema50;
  const priceAboveEma200 = entryPrice > trend.ema200;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Trend Analysis</h3>
        <span className="text-[10px] text-slate-500">EMA 50/200</span>
      </div>

      <div className={`mt-3 flex items-center justify-between rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}>
        <div className="flex items-center gap-2.5">
          <DirIcon className={`h-5 w-5 ${cfg.text}`} />
          <div>
            <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label} Trend</p>
            <p className="text-[10px] text-slate-500">Strength {trend.strength}/100</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Strength</p>
          <p className={`tabular text-lg font-bold ${cfg.text}`}>{trend.strength}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">EMA 50</span>
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${priceAboveEma50 ? 'text-bull-400' : 'text-bear-400'}`}>
              {priceAboveEma50 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {priceAboveEma50 ? 'Above' : 'Below'}
            </span>
          </div>
          <p className="tabular mt-1 text-base font-semibold text-slate-200">{trend.ema50.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">EMA 200</span>
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${priceAboveEma200 ? 'text-bull-400' : 'text-bear-400'}`}>
              {priceAboveEma200 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {priceAboveEma200 ? 'Above' : 'Below'}
            </span>
          </div>
          <p className="tabular mt-1 text-base font-semibold text-slate-200">{trend.ema200.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">EMA Spread</span>
          <span className="tabular text-[11px] font-semibold text-slate-300">{trend.spread.toFixed(2)}</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div className={`h-full rounded-full transition-all duration-700 ${trend.direction === 'BULLISH' ? 'bg-gradient-to-r from-bull-600 to-bull-400' : trend.direction === 'BEARISH' ? 'bg-gradient-to-r from-bear-600 to-bear-400' : 'bg-slate-500'}`}
            style={{ width: `${spreadPct}%` }} />
        </div>
      </div>
    </GlassCard>
  );
}
