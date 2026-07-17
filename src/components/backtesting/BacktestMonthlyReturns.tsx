import { CalendarRange } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type MonthlyReturn } from '../../data/backtesting';

interface Props {
  monthly: MonthlyReturn[];
}

export function BacktestMonthlyReturns({ monthly }: Props) {
  const maxAbs = Math.max(...monthly.map((m) => Math.abs(m.pnl)), 1);
  const chartH = 160;
  const barW = monthly.length > 0 ? Math.min(48, 320 / monthly.length) : 40;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Returns</h3>
            <p className="text-[11px] text-slate-500">P/L breakdown by month</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-center gap-3" style={{ height: chartH + 40 }}>
        {monthly.map((m) => {
          const h = Math.max(4, (Math.abs(m.pnl) / maxAbs) * chartH);
          const isProfit = m.pnl >= 0;
          const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' });
          return (
            <div key={m.month} className="flex flex-col items-center gap-1.5" style={{ width: barW }}>
              <span className={`tabular text-[10px] font-medium ${isProfit ? 'text-bull-400' : 'text-bear-400'}`}>
                {isProfit ? '+' : ''}{m.pnl.toFixed(0)}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${isProfit ? 'bg-gradient-to-t from-bull-600/60 to-bull-400' : 'bg-gradient-to-t from-bear-600/60 to-bear-400'}`}
                  style={{ height: h }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{monthLabel}</span>
              <span className={`text-[9px] font-medium ${isProfit ? 'text-bull-400/70' : 'text-bear-400/70'}`}>{isProfit ? '+' : ''}{m.returnPct.toFixed(1)}%</span>
            </div>
          );
        })}
        {monthly.length === 0 && <p className="text-sm text-slate-500">No data available</p>}
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 border-t border-white/5 pt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-bull-400" />Profitable</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-bear-400" />Loss</span>
      </div>
    </GlassCard>
  );
}
