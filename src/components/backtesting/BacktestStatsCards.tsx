import { Target, Percent, Activity, DollarSign, TrendingDown, Scale, Award, Zap } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type BacktestStats } from '../../data/backtesting';
import { formatCurrency } from '../../data/trading';

interface Props {
  stats: BacktestStats;
}

interface CardDef {
  label: string;
  value: string;
  icon: typeof Target;
  accent: 'brand' | 'gold' | 'bull' | 'bear';
  sub?: string;
}

export function BacktestStatsCards({ stats }: Props) {
  const cards: CardDef[] = [
    { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: Percent, accent: stats.winRate >= 60 ? 'bull' : 'gold', sub: `${stats.winningTrades}W / ${stats.losingTrades}L` },
    { label: 'Profit Factor', value: stats.profitFactor.toFixed(2), icon: Scale, accent: stats.profitFactor >= 1.5 ? 'bull' : stats.profitFactor >= 1 ? 'gold' : 'bear', sub: stats.profitFactor >= 1.5 ? 'Healthy' : 'Marginal' },
    { label: 'Sharpe Ratio', value: stats.sharpeRatio.toFixed(2), icon: Activity, accent: stats.sharpeRatio >= 1 ? 'bull' : 'gold', sub: stats.sharpeRatio >= 1 ? 'Good' : 'Below target' },
    { label: 'Max Drawdown', value: `${stats.maxDrawdownPct.toFixed(2)}%`, icon: TrendingDown, accent: stats.maxDrawdownPct < 10 ? 'bull' : stats.maxDrawdownPct < 20 ? 'gold' : 'bear', sub: formatCurrency(stats.maxDrawdown) },
    { label: 'Net Profit', value: formatCurrency(stats.netProfit), icon: DollarSign, accent: stats.netProfit >= 0 ? 'bull' : 'bear', sub: `${stats.returnPct >= 0 ? '+' : ''}${stats.returnPct.toFixed(1)}% return` },
    { label: 'Avg Win', value: formatCurrency(stats.avgWin), icon: Award, accent: 'bull', sub: `Best: ${formatCurrency(stats.largestWin)}` },
    { label: 'Avg Loss', value: formatCurrency(stats.avgLoss), icon: TrendingDown, accent: 'bear', sub: `Worst: ${formatCurrency(stats.largestLoss)}` },
    { label: 'Avg R:R', value: stats.avgRR.toFixed(2), icon: Zap, accent: stats.avgRR >= 1.5 ? 'bull' : 'gold', sub: `Expectancy: ${formatCurrency(stats.expectancy)}` },
    { label: 'Total Trades', value: String(stats.totalTrades), icon: Target, accent: 'brand', sub: `${stats.breakevenTrades} breakeven` },
  ];

  const accentMap: Record<string, { ring: string; text: string }> = {
    brand: { ring: 'bg-brand-500/15', text: 'text-brand-300' },
    gold: { ring: 'bg-gold-500/15', text: 'text-gold-400' },
    bull: { ring: 'bg-bull-500/15', text: 'text-bull-400' },
    bear: { ring: 'bg-bear-500/15', text: 'text-bear-400' },
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
      {cards.map((c) => {
        const a = accentMap[c.accent];
        const Icon = c.icon;
        return (
          <GlassCard key={c.label} className={`p-4 animate-fade-in`} >
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.ring} ${a.text}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{c.label}</p>
                <p className={`tabular text-lg font-bold leading-tight ${a.text}`}>{c.value}</p>
                {c.sub && <p className="truncate text-[10px] text-slate-500">{c.sub}</p>}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}