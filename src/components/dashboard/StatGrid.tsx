import { Wallet, TrendingUp, Unlock, Shield, Activity, Target, Power, DollarSign } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { account, formatCurrency } from '../../data/trading';
import { useGlobalMarket } from '../../hooks/useGlobalMarket';

export function StatGrid() {
  const { symbol, currentPrice, quote, analysis } = useGlobalMarket();
  const statusText = account.openPositions > 0 ? 'TRADING' : 'IDLE';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
      <div className="animate-delay-100">
        <StatCard
          label={`${symbol} Price`}
          value={currentPrice > 0 ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
          icon={<DollarSign className="h-5 w-5" />}
          accent="brand"
          sub={quote ? `Spread ${quote.spread.toFixed(2)}` : 'Awaiting data'}
          progress={Math.min(100, Math.abs(quote?.changePct ?? 0) * 20)}
        />
      </div>
      <div className="animate-delay-100">
        <StatCard
          label="AI Signal"
          value={analysis.decision.replace('_', ' ')}
          icon={<Activity className="h-5 w-5" />}
          accent={analysis.decision === 'BUY' ? 'bull' : analysis.decision === 'SELL' ? 'bear' : 'neutral'}
          sub={`${analysis.confidence}% confidence`}
          progress={analysis.confidence}
        />
      </div>
      <div className="animate-delay-100">
        <StatCard
          label="Trend"
          value={analysis.trend.direction}
          icon={<TrendingUp className="h-5 w-5" />}
          accent={analysis.trend.direction === 'BULLISH' ? 'bull' : analysis.trend.direction === 'BEARISH' ? 'bear' : 'neutral'}
          sub={`Strength ${analysis.trend.strength}/100`}
          progress={analysis.trend.strength}
        />
      </div>
      <div className="animate-delay-200">
        <StatCard label="Account Balance" value={formatCurrency(account.balance)} icon={<Wallet className="h-5 w-5" />} accent="brand" sub={`Equity ${formatCurrency(account.equity)}`} progress={68} />
      </div>
      <div className="animate-delay-200">
        <StatCard label="Free Margin" value={formatCurrency(account.freeMargin)} icon={<Unlock className="h-5 w-5" />} accent="gold" sub={`Used ${formatCurrency(account.usedMargin)}`} progress={92} />
      </div>
      <div className="animate-delay-200">
        <StatCard label="Margin Level" value={`${account.marginLevel.toFixed(1)}%`} icon={<Shield className="h-5 w-5" />} accent="brand" sub="Healthy" progress={Math.min(100, account.marginLevel / 5)} />
      </div>
      <div className="animate-delay-300">
        <StatCard label="Today's P/L" value={formatCurrency(account.todayPnl)} icon={<Activity className="h-5 w-5" />} accent="bull" delta={`+${account.todayPnlPct}%`} deltaPositive sub="Session gains" progress={62} />
      </div>
      <div className="animate-delay-300">
        <StatCard label="Win Rate" value={`${account.winRate.toFixed(1)}%`} icon={<Target className="h-5 w-5" />} accent="bull" sub={`${account.wins}W / ${account.losses}L`} progress={account.winRate} />
      </div>
      <div className="animate-delay-300">
        <StatCard label="Trading Status" value={statusText} icon={<Power className="h-5 w-5" />} accent={statusText === 'TRADING' ? 'bull' : 'neutral'} sub={`${account.totalTrades} total trades`} progress={statusText === 'TRADING' ? 100 : 0} />
      </div>
    </div>
  );
}