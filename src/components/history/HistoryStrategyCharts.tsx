import { Trophy, PieChart as PieIcon } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type HistoryTrade, buildStrategyStats, computeStats } from '../../data/history';

export function StrategyBreakdown({ trades }: { trades: HistoryTrade[] }) {
  const stats = buildStrategyStats(trades);
  const maxPnl = Math.max(...stats.map((s) => Math.abs(s.pnl)), 1);
  const maxAbs = Math.max(...stats.map((s) => Math.abs(s.pnl)));

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold-400" />
          <h3 className="text-sm font-semibold text-white">Strategy Breakdown</h3>
        </div>
        <span className="text-[10px] text-slate-500">By P/L</span>
      </div>

      <div className="mt-4 space-y-2">
        {stats.map((s) => {
          const positive = s.pnl >= 0;
          const barW = (Math.abs(s.pnl) / maxPnl) * 100;
          return (
            <div key={s.strategy} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">{s.strategy}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{s.wins}/{s.total}</span>
                  <span className={`tabular text-xs font-bold ${positive ? 'text-bull-400' : 'text-bear-400'}`}>
                    {positive ? '+' : ''}${s.pnl.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${positive ? 'bg-gradient-to-r from-bull-600 to-bull-400' : 'bg-gradient-to-r from-bear-600 to-bear-400'}`}
                  style={{ width: `${barW}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-slate-600">
                <span>{s.winPct.toFixed(0)}% win rate</span>
                <span>{((Math.abs(s.pnl) / maxAbs) * 100).toFixed(0)}% of max</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export function WinLossDonut({ trades }: { trades: HistoryTrade[] }) {
  const stats = computeStats(trades);
  const total = stats.total || 1;

  const segments = [
    { label: 'Wins', value: stats.wins, color: '#34E2A1' },
    { label: 'Losses', value: stats.losses, color: '#FF6B81' },
    { label: 'Breakeven', value: stats.breakevens, color: '#F5B544' },
  ].filter((s) => s.value > 0);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Win / Loss / BE</h3>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
            {segments.map((seg) => {
              const dash = (seg.value / total) * circumference;
 const el = (
                <circle key={seg.label} cx="75" cy="75" r={radius} fill="none" stroke={seg.color} strokeWidth="14"
                  strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />
              );
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-white">{stats.winPct.toFixed(0)}%</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Win Rate</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-xs text-slate-300">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular text-xs font-semibold text-slate-200">{seg.value}</span>
                <span className="tabular text-[10px] text-slate-500">{((seg.value / total) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
