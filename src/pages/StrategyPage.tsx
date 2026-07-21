import { useEffect } from 'react';
import { LineChart, TrendingUp, ArrowUpRight } from 'lucide-react';
import { GlassCard, Badge } from '../components/ui/GlassCard';
import { TrendAnalysisCard } from '../components/strategy/TrendAnalysisCard';
import { MarketStructureCard } from '../components/strategy/MarketStructureCard';
import { SmartMoneyCard } from '../components/strategy/SmartMoneyCard';
import { IndicatorsCard } from '../components/strategy/IndicatorsCard';
import { AiDecisionPanel } from '../components/strategy/AiDecisionPanel';
import { SessionConditionCard } from '../components/strategy/SessionConditionCard';
import { TradeReportCard } from '../components/strategy/TradeReportCard';
import { MarketDataStatusBar } from '../components/dashboard/MarketDataStatusBar';
import { generateTradeReport } from '../services/tradeReportGenerator';
import { strategyEventManager } from '../services/strategyEventManager';
import { useMarketData } from '../hooks/useMarketData';
import { useGlobalMarket } from '../hooks/useGlobalMarket';
import { useStrategyEvents } from '../hooks/useStrategyEvents';
import { useSignalId } from '../hooks/useSignalId';
import { getSymbolLabel } from '../store/marketStore';

const decisionBanner: Record<string, { text: string; bg: string; border: string }> = {
  BUY: { text: 'text-bull-400', bg: 'bg-bull-500/10', border: 'border-bull-500/30' },
  SELL: { text: 'text-bear-400', bg: 'bg-bear-500/10', border: 'border-bear-500/30' },
  NO_TRADE: { text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10' },
};

export function StrategyPage() {
  const { symbol, timeframe, analysis, currentPrice } = useGlobalMarket();
  const marketData = useMarketData(symbol, timeframe);
  const events = useStrategyEvents();
  const signalIdEntry = useSignalId();

  // Feed the live StrategyAnalysis into the event manager whenever it changes.
  // This is the ONE StrategyAnalysis object — no duplicated analysis anywhere.
  useEffect(() => {
    if (analysis.structurePoints.length > 0) {
      strategyEventManager.processAnalysis(analysis);
    }
  }, [analysis]);

  const banner = decisionBanner[analysis.decision];
  const showReport = analysis.decision === 'BUY' || analysis.decision === 'SELL';
  const tradeReport = showReport
    ? { ...generateTradeReport(analysis), signalId: signalIdEntry?.signalId ?? events.lastSignalId ?? undefined }
    : null;

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
            <p className="text-xs text-slate-500">AI-powered market structure & signal analysis · {getSymbolLabel(symbol)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" dot>{analysis.symbol}</Badge>
          <Badge variant="gold">{analysis.timeframe}</Badge>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Price</span>
            <span className="tabular text-sm font-bold text-white">{currentPrice > 0 ? currentPrice.toFixed(2) : '—'}</span>
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
                <p className={`text-lg font-bold ${banner.text}`}>{analysis.decision.replace('_', ' ')}</p>
                <span className="flex items-center gap-0.5 text-xs text-bull-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {analysis.confidence}% confidence
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Entry</p>
              <p className="tabular text-sm font-semibold text-slate-200">{analysis.entryPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Stop Loss</p>
              <p className="tabular text-sm font-semibold text-bear-400">{analysis.stopLoss.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Take Profit</p>
              <p className="tabular text-sm font-semibold text-bull-400">{analysis.takeProfit.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">R/R</p>
              <p className="tabular text-sm font-semibold text-gold-400">{analysis.riskRewardRatio.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Column 1 */}
        <div className="space-y-4">
          <TrendAnalysisCard trend={analysis.trend} entryPrice={analysis.entryPrice} />
          <IndicatorsCard indicators={analysis.indicators} />
        </div>
        {/* Column 2 */}
        <div className="space-y-4">
          <MarketStructureCard points={analysis.structurePoints} />
          <SessionConditionCard session={analysis.session} marketCondition={analysis.marketCondition} />
        </div>
        {/* Column 3 */}
        <div className="space-y-4">
          <AiDecisionPanel decision={analysis.decision} confidence={analysis.confidence} reasons={analysis.reasons} />
          <SmartMoneyCard concepts={analysis.smartMoneyConcepts} />
        </div>
      </div>

      {/* DHS AI Trade Report — shown for BUY/SELL decisions */}
      {showReport && tradeReport && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TradeReportCard report={tradeReport} />
        </div>
      )}
    </div>
  );
}