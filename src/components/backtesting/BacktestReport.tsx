import { FileText, CheckCircle2, AlertTriangle, Lightbulb, TrendingUp, TrendingDown, Flame, Clock } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { type BacktestReport, type BacktestStats, type BacktestConfig } from '../../data/backtesting';

interface Props {
  report: BacktestReport;
  stats: BacktestStats;
  config: BacktestConfig;
}

export function BacktestReport({ report, stats, config }: Props) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Backtest Report</h3>
            <p className="text-[11px] text-slate-500">AI-generated performance analysis</p>
          </div>
        </div>
        <Badge variant={stats.netProfit >= 0 ? 'success' : 'danger'} dot>
          {stats.netProfit >= 0 ? 'PROFITABLE' : 'UNPROFITABLE'}
        </Badge>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-ink-800/40 p-4">
        <p className="text-sm leading-relaxed text-slate-300">{report.summary}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-bull-500/15 bg-bull-500/[0.04] p-4">
          <div className="flex items-center gap-2 text-bull-400">
            <CheckCircle2 className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Strengths</h4>
          </div>
          <ul className="mt-3 space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <span className="mt-0.5 text-bull-400">+</span>
                <span>{s}</span>
              </li>
            ))}
            {report.strengths.length === 0 && <li className="text-xs text-slate-500">No significant strengths identified.</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-bear-500/15 bg-bear-500/[0.04] p-4">
          <div className="flex items-center gap-2 text-bear-400">
            <AlertTriangle className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Weaknesses</h4>
          </div>
          <ul className="mt-3 space-y-2">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <span className="mt-0.5 text-bear-400">!</span>
                <span>{w}</span>
              </li>
            ))}
            {report.weaknesses.length === 0 && <li className="text-xs text-slate-500">No significant weaknesses found.</li>}
          </ul>
        </div>

        <div className="rounded-xl border border-gold-500/15 bg-gold-500/[0.04] p-4">
          <div className="flex items-center gap-2 text-gold-400">
            <Lightbulb className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Recommendations</h4>
          </div>
          <ul className="mt-3 space-y-2">
            {report.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <span className="mt-0.5 text-gold-400">&rarr;</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 sm:grid-cols-4 lg:grid-cols-6">
        <Stat icon={TrendingUp} label="Best Month" value={report.bestMonth} accent="bull" />
        <Stat icon={TrendingDown} label="Worst Month" value={report.worstMonth} accent="bear" />
        <Stat icon={Flame} label="Win Streak" value={`${report.longestWinStreak}`} accent="bull" />
        <Stat icon={Flame} label="Loss Streak" value={`${report.longestLossStreak}`} accent="bear" />
        <Stat icon={Clock} label="Trades/Day" value={report.avgTradesPerDay.toFixed(1)} accent="brand" />
        <Stat icon={AlertTriangle} label="Max Consec. Loss" value={`${report.maxConsecutiveLosses}`} accent="gold" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-600">
        <span>Strategy: {config.strategy} · {config.symbol} · {config.timeframe}</span>
        <span>{stats.totalTrades} trades analyzed</span>
      </div>
    </GlassCard>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof TrendingUp; label: string; value: string; accent: 'bull' | 'bear' | 'brand' | 'gold' }) {
  const colors: Record<string, string> = { bull: 'text-bull-400', bear: 'text-bear-400', brand: 'text-brand-300', gold: 'text-gold-400' };
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${colors[accent]}`} />
      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
        <p className={`tabular text-sm font-semibold ${colors[accent]}`}>{value}</p>
      </div>
    </div>
  );
}