import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { news, type NewsItem } from '../../data/trading';

const impactConfig: Record<NewsItem['impact'], { label: string; variant: 'danger' | 'warning' | 'brand'; bar: string }> = {
  HIGH: { label: 'HIGH', variant: 'danger', bar: 'bg-bear-500' },
  MEDIUM: { label: 'MED', variant: 'warning', bar: 'bg-gold-500' },
  LOW: { label: 'LOW', variant: 'brand', bar: 'bg-brand-500' },
};

export function EconomicNews() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-gold-400" />
          <h3 className="text-sm font-semibold text-white">Economic News</h3>
        </div>
        <span className="text-[10px] text-slate-500">Today · USD</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {news.map((item) => {
          const cfg = impactConfig[item.impact];
          const actual = item.actual;
          const hasActual = actual !== undefined;
          const actualPositive = hasActual && item.forecast !== undefined && actual > item.forecast;
          const actualNegative = hasActual && item.forecast !== undefined && actual < item.forecast;
          return (
            <div key={item.id} className="relative overflow-hidden rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-white/10">
              <div className={`absolute left-0 top-0 h-full w-0.5 ${cfg.bar}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="tabular text-[11px] font-semibold text-slate-400">{item.time}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${cfg.variant === 'danger' ? 'bg-bear-500/15 text-bear-400' : cfg.variant === 'warning' ? 'bg-gold-500/15 text-gold-400' : 'bg-brand-500/15 text-brand-300'}`}>
                      {cfg.label}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">{item.currency}</span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-200">{item.title}</p>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p className="uppercase tracking-wider text-slate-600">Forecast</p>
                  <p className="tabular mt-0.5 font-semibold text-slate-300">{item.forecast ?? '—'}</p>
                </div>
                <div>
                  <p className="uppercase tracking-wider text-slate-600">Previous</p>
                  <p className="tabular mt-0.5 font-semibold text-slate-400">{item.previous ?? '—'}</p>
                </div>
                <div>
                  <p className="uppercase tracking-wider text-slate-600">Actual</p>
                  {hasActual ? (
                    <p className={`tabular mt-0.5 flex items-center gap-1 font-semibold ${actualPositive ? 'text-bull-400' : actualNegative ? 'text-bear-400' : 'text-gold-400'}`}>
                      {actualPositive ? <TrendingUp className="h-3 w-3" /> : actualNegative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {actual}
                    </p>
                  ) : (
                    <p className="tabular mt-0.5 flex items-center gap-1 font-semibold text-slate-600"><Minus className="h-3 w-3" />Pending</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}