import { Target, DollarSign, Scale, TrendingUp, TrendingDown, Layers, Clock, Percent } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { computeStats, type HistoryTrade } from '../../data/history';

interface CardDef {
  label: string;
  value: string;
  icon: typeof Target;
  accent: 'brand' | 'gold' | 'bull' | 'bear';
  sub?: string;
  progress?: number;
}

export function HistorySummaryCards({ trades }: { trades: HistoryTrade[] }) {
  const stats = computeStats(trades);

  const cards: CardDef[] = [
    { label: 'Win Rate', value: `${stats.winPct.toFixed(1)}%`, icon: Target, accent: 'bull', sub: `${stats.wins}W / ${stats.losses}L / ${stats.breakevens}BE`, progress: stats.winPct },
    { label: 'Total Net P/L', value: `$${stats.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, accent: stats.netPnl >= 0 ? 'bull' : 'bear', sub: `Gross $${stats.totalPnl.toFixed(0)}` },
    { label: 'Average R/R', value: stats.avgRR.toFixed(2), icon: Scale, accent: 'gold', sub: 'Risk/reward ratio' },
    { label: 'Largest Win', value: `+$${stats.largestWin.toFixed(0)}`, icon: TrendingUp, accent: 'bull', sub: 'Single best trade' },
    { label: 'Largest Loss', value: `-$${Math.abs(stats.largestLoss).toFixed(0)}`, icon: TrendingDown, accent: 'bear', sub: 'Single worst trade' },
    { label: 'Total Trades', value: String(stats.total), icon: Layers, accent: 'brand', sub: 'Closed positions' },
    { label: 'Avg Duration', value: `${Math.floor(stats.avgDurationMin / 60)}h ${Math.round(stats.avgDurationMin % 60)}m`, icon: Clock, accent: 'gold', sub: 'Per trade' },
    { label: 'Profit Factor', value: stats.profitFactor.toFixed(2), icon: Percent, accent: stats.profitFactor >= 1.5 ? 'bull' : 'gold', sub: 'Gross profit / loss', progress: Math.min(100, stats.profitFactor * 30) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`animate-delay-${['100', '100', '100', '100', '200', '200', '200', '200'][i] ?? '100'}`}>
            <StatCard label={c.label} value={c.value} icon={<Icon className="h-5 w-5" />} accent={c.accent} sub={c.sub} progress={c.progress} />
          </div>
        );
      })}
    </div>
  );
}
