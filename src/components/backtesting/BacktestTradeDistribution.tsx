import { BarChart3 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type TradeDistribution } from '../../data/backtesting';

interface Props {
  distribution: TradeDistribution[];
}

export function BacktestTradeDistribution({ distribution }: Props) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const chartH = 140;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Trade Distribution</h3>
            <p className="text-[11px] text-slate-500">P/L per trade (pips)</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-1.5" style={{ height: chartH + 30 }}>
        {distribution.map((d) => {
          const h = (d.count / maxCount) * chartH;
          const isPositive = d.pnl >= 0;
          return (
            <div key={d.range} className="flex flex-1 flex-col items-center gap-1">
              <span className="tabular text-[10px] font-medium text-slate-400">{d.count}</span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-[32px] rounded-t transition-all duration-500 ${d.count === 0 ? 'bg-white/5' : isPositive ? 'bg-gradient-to-t from-bull-600/50 to-bull-400/80' : 'bg-gradient-to-t from-bear-600/50 to-bear-400/80'}`}
                  style={{ height: Math.max(2, h) }}
                  title={`${d.range}: ${d.count} trades, $${d.pnl.toFixed(2)}`}
                />
              </div>
              <span className="text-[8px] leading-tight text-slate-500 text-center">{d.range}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 border-t border-white/5 pt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-bull-400" />Profit trades</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-bear-400" />Loss trades</span>
      </div>
    </GlassCard>
  );
}