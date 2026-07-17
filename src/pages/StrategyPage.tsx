import { LineChart, TrendingUp, ArrowUpRight } from 'lucide-react';
import { GlassCard, Badge } from '../components/ui/GlassCard';
import { TrendAnalysisCard } from '../components/strategy/TrendAnalysisCard';
import { MarketStructureCard } from '../components/strategy/MarketStructureCard';
import { SmartMoneyCard } from '../components/strategy/SmartMoneyCard';
import { IndicatorsCard } from '../components/strategy/IndicatorsCard';
import { AiDecisionPanel } from '../components/strategy/AiDecisionPanel';
import { SessionConditionCard } from '../components/strategy/SessionConditionCard';
import { MarketDataStatusBar } from '../components/dashboard/MarketDataStatusBar';
import { strategyData } from '../data/strategy';
import { useMarketData } from '../hooks/useMarketData';

const decisionBanner: Record<string, { text: string; bg: string; border: string }> = {
  BUY: { text: 'text-bull-400', bg: 'bg-bull-500/10', border: 'border-bull-500/30' },
  SELL: { text: 'text-bear-400', bg: 'bg-bear-500/10', border: 'border-bear-500/30' },
  NO_TRADE: { text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10' },
};

export function StrategyPage() {
  const s = strategyData;
  const banner = decisionBanner[s.decision];
  const marketData = useMarketData('XAU/USD', 'M15');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Strategy Analysis</h1>
            <p className="text-xs text-slate-500">AI-powered market structure & signal analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" dot>{s.symbol}</Badge>
          <Badge variant="gold">{s.timeframe}</Badge>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Price</span>
            <span className="tabular text-sm font-bold text-white">{s.entryPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Market data status */}
      <MarketDataStatusBar state={marketData} />

      {/* AI recommendation banner */}
      <GlassCard hover={false} className={`border ${banner.border} ${banner.bg} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${banner.bg} ${banner.text}`}>
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">AI Recommendation</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-bold ${banner.text}`}>{s.decision.replace('_', ' ')}</p>
                <span className="flex items-center gap-0.5 text-xs text-bull-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {s.confidence}% confidence
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Entry</p>
              <p className="tabular text-sm font-semibold text-slate-200">{s.entryPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Stop Loss</p>
              <p className="tabular text-sm font-semibold text-bear-400">{s.stopLoss.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Take Profit</p>
              <p className="tabular text-sm font-semibold text-bull-400">{s.takeProfit.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">R/R</p>
              <p className="tabular text-sm font-semibold text-gold-400">{s.riskRewardRatio.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Column 1 */}
        <div className="space-y-4">
          <TrendAnalysisCard trend={s.trend} entryPrice={s.entryPrice} />
          <IndicatorsCard indicators={s.indicators} />
        </div>
        {/* Column 2 */}
        <div className="space-y-4">
          <MarketStructureCard points={s.structurePoints} />
          <SessionConditionCard session={s.session} marketCondition={s.marketCondition} />
        </div>
        {/* Column 3 */}
        <div className="space-y-4">
          <AiDecisionPanel decision={s.decision} confidence={s.confidence} reasons={s.reasons} />
          <SmartMoneyCard concepts={s.smartMoneyConcepts} />
        </div>
      </div>
    </div>
  );
}
