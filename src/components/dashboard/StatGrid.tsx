import { Wallet, TrendingUp, Unlock, Shield, Activity, Layers, Target, Gauge, Power } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { account, formatCurrency } from '../../data/trading';

export function StatGrid() {
  const statusText = account.openPositions > 0 ? 'TRADING' : 'IDLE';
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
      <div className="animate-delay-100">
        <StatCard label="Account Balance" value={formatCurrency(account.balance)} icon={<Wallet className="h-5 w-5" />} accent="brand" sub={`Equity ${formatCurrency(account.equity)}`} progress={68} />
      </div>
      <div className="animate-delay-100">
        <StatCard label="Equity" value={formatCurrency(account.equity)} icon={<TrendingUp className="h-5 w-5" />} accent="bull" delta={`+${account.todayPnlPct}%`} deltaPositive sub={`Today ${formatCurrency(account.todayPnl)}`} progress={74} />
      </div>
      <div className="animate-delay-100">
        <StatCard label="Free Margin" value={formatCurrency(account.freeMargin)} icon={<Unlock className="h-5 w-5" />} accent="gold" sub={`Used ${formatCurrency(account.usedMargin)}`} progress={92} />
      </div>
      <div className="animate-delay-200">
        <StatCard label="Margin Level" value={`${account.marginLevel.toFixed(1)}%`} icon={<Shield className="h-5 w-5" />} accent="brand" sub="Healthy" progress={Math.min(100, account.marginLevel / 5)} />
      </div>
      <div className="animate-delay-200">
        <StatCard label="Today's P/L" value={formatCurrency(account.todayPnl)} icon={<Activity className="h-5 w-5" />} accent="bull" delta={`+${account.todayPnlPct}%`} deltaPositive sub="Session gains" progress={62} />
      </div>
      <div className="animate-delay-200">
        <StatCard label="Open Positions" value={String(account.openPositions)} icon={<Layers className="h-5 w-5" />} accent="gold" sub={`of ${account.maxTrades} max`} progress={(account.openPositions / account.maxTrades) * 100} />
      </div>
      <div className="animate-delay-300">
        <StatCard label="Win Rate" value={`${account.winRate.toFixed(1)}%`} icon={<Target className="h-5 w-5" />} accent="bull" sub={`${account.wins}W / ${account.losses}L`} progress={account.winRate} />
      </div>
      <div className="animate-delay-300">
        <StatCard label="Risk Percentage" value={`${account.riskPct.toFixed(1)}%`} icon={<Gauge className="h-5 w-5" />} accent="bear" sub="Per trade" progress={account.riskPct * 10} />
      </div>
      <div className="animate-delay-300">
        <StatCard label="Trading Status" value={statusText} icon={<Power className="h-5 w-5" />} accent={statusText === 'TRADING' ? 'bull' : 'neutral'} sub={`${account.totalTrades} total trades`} progress={statusText === 'TRADING' ? 100 : 0} />
      </div>
    </div>
  );
}
