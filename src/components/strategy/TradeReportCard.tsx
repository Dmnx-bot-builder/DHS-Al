// DHS AI Trade Report — professional structured report card
// Displays a full trade report derived from the DHS Strategy Engine.

import {
  FileText, TrendingUp, TrendingDown, Ban, Target, Shield, ShieldAlert,
  Gauge, Activity, Layers, Droplets, BarChart3, Clock, Percent,
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Hash,
} from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import type { TradeReport, AiDecision } from '../../types';

const dirConfig: Record<AiDecision, { text: string; bg: string; border: string; icon: typeof TrendingUp; label: string }> = {
  BUY: { text: 'text-bull-400', bg: 'bg-bull-500/10', border: 'border-bull-500/30', icon: TrendingUp, label: 'BUY' },
  SELL: { text: 'text-bear-400', bg: 'bg-bear-500/10', border: 'border-bear-500/30', icon: TrendingDown, label: 'SELL' },
  NO_TRADE: { text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', icon: Ban, label: 'NO TRADE' },
};

function SectionHeader({ icon: Icon, title, accent }: { icon: typeof FileText; title: string; accent: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
      <Icon className={`h-4 w-4 ${accent}`} />
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{title}</h3>
    </div>
  );
}

function AnalysisRow({ label, text, icon: Icon, accent }: { label: string; text: string; icon: typeof Activity; accent: string }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}

function ConfidenceBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{label}</span>
        <span className={`tabular text-[11px] font-bold ${accent}`}>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full transition-all duration-700 ${accent.replace('text-', 'bg-')}`}
          style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface TradeReportCardProps {
  report: TradeReport;
}

export function TradeReportCard({ report }: TradeReportCardProps) {
  const { signal, marketAnalysis, entry, stopLoss, takeProfit, invalidation, riskManagement, confidenceBreakdown } = report;
  const cfg = dirConfig[signal.direction];
  const DirIcon = cfg.icon;
  const isBuy = signal.direction === 'BUY';
  const isSell = signal.direction === 'SELL';

  return (
    <GlassCard hover={false} className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white">DHS AI Trade Report</h3>
        </div>
        <Badge variant="brand" dot>{report.marketCondition}</Badge>
      </div>

      {/* Signal Information */}
      {report.signalId && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2">
          <Hash className="h-3.5 w-3.5 text-brand-300" />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Signal ID</span>
          <span className="ml-auto font-mono text-[11px] font-semibold text-brand-300">{report.signalId}</span>
        </div>
      )}

      {/* ── 1. Signal Summary ── */}
      <div className="mt-4">
        <SectionHeader icon={Activity} title="1. Signal Summary" accent="text-brand-400" />
        <div className={`mt-3 flex items-center justify-between rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cfg.bg} ${cfg.text}`}>
              <DirIcon className="h-6 w-6" />
            </div>
            <div>
              <p className={`text-base font-bold ${cfg.text}`}>{cfg.label}</p>
              <p className="text-[10px] text-slate-500">{signal.asset} · {signal.time}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</p>
            <p className={`tabular text-xl font-bold ${cfg.text}`}>{signal.confidence}%</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Asset</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-200">{signal.asset}</p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Current Price</p>
            <p className="tabular mt-0.5 text-sm font-semibold text-white">{signal.currentPrice.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Trend (M30)</p>
            <p className={`mt-0.5 text-sm font-semibold ${signal.trendM30 === 'BULLISH' ? 'text-bull-400' : signal.trendM30 === 'BEARISH' ? 'text-bear-400' : 'text-slate-300'}`}>
              {signal.trendM30}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Session</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-200">{report.session}</p>
          </div>
        </div>
      </div>

      {/* ── 2. Market Analysis ── */}
      <div className="mt-5">
        <SectionHeader icon={Layers} title="2. Market Analysis" accent="text-brand-400" />
        <div className="mt-3 space-y-2">
          <AnalysisRow label="Market Structure" text={marketAnalysis.marketStructure} icon={Layers} accent="text-brand-400" />
          <AnalysisRow label="Break of Structure (BOS)" text={marketAnalysis.breakOfStructure} icon={TrendingUp} accent={isBuy ? 'text-bull-400' : 'text-bear-400'} />
          <AnalysisRow label="Change of Character (CHOCH)" text={marketAnalysis.changeOfCharacter} icon={Activity} accent="text-gold-400" />
          <AnalysisRow label="Liquidity Sweep" text={marketAnalysis.liquiditySweep} icon={Droplets} accent="text-brand-300" />
          <AnalysisRow label="Demand / Supply Zone" text={marketAnalysis.demandSupplyZone} icon={Target} accent="text-gold-400" />
          <AnalysisRow label="EMA50 vs EMA200" text={marketAnalysis.emaAlignment} icon={BarChart3} accent="text-brand-400" />
          <AnalysisRow label="RSI" text={marketAnalysis.rsi} icon={Gauge} accent="text-brand-300" />
          <AnalysisRow label="MACD" text={marketAnalysis.macd} icon={BarChart3} accent={marketAnalysis.macd.includes('bullish') ? 'text-bull-400' : marketAnalysis.macd.includes('bearish') ? 'text-bear-400' : 'text-slate-400'} />
          <AnalysisRow label="ATR" text={marketAnalysis.atr} icon={Activity} accent="text-gold-400" />
        </div>
      </div>

      {/* ── 3. Entry ── */}
      <div className="mt-5">
        <SectionHeader icon={Target} title="3. Entry" accent={isBuy ? 'text-bull-400' : isSell ? 'text-bear-400' : 'text-slate-400'} />
        <div className="mt-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Entry Price</span>
            <span className="tabular text-lg font-bold text-white">{entry.price.toFixed(2)}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{entry.reason}</p>
        </div>
      </div>

      {/* ── 4. Stop Loss ── */}
      <div className="mt-5">
        <SectionHeader icon={Shield} title="4. Stop Loss" accent="text-bear-400" />
        <div className="mt-3 rounded-lg border border-bear-500/20 bg-bear-500/5 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Stop Loss Price</span>
              <p className="tabular mt-0.5 text-lg font-bold text-bear-400">{stopLoss.price.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Distance</span>
              <p className="tabular mt-0.5 text-sm font-semibold text-slate-200">{stopLoss.distancePips.toFixed(1)} pips</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{stopLoss.reason}</p>
        </div>
      </div>

      {/* ── 5. Take Profit ── */}
      <div className="mt-5">
        <SectionHeader icon={Target} title="5. Take Profit" accent="text-bull-400" />
        <div className="mt-3 rounded-lg border border-bull-500/20 bg-bull-500/5 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Take Profit Price</span>
              <p className="tabular mt-0.5 text-lg font-bold text-bull-400">{takeProfit.price.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Risk / Reward</span>
              <p className="tabular mt-0.5 text-sm font-semibold text-gold-400">1:{takeProfit.riskRewardRatio.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{takeProfit.reason}</p>
        </div>
      </div>

      {/* ── 6. Trade Invalidation ── */}
      <div className="mt-5">
        <SectionHeader icon={ShieldAlert} title="6. Trade Invalidation" accent="text-gold-400" />
        <div className="mt-3 space-y-1.5">
          {invalidation.conditions.length > 0 ? (
            invalidation.conditions.map((cond, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-gold-500/10 bg-gold-500/5 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" />
                <p className="text-[11px] leading-relaxed text-gold-200">{cond}</p>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-slate-500">No specific invalidation conditions detected by the engine for the current signal.</p>
          )}
        </div>
      </div>

      {/* ── 7. Risk Management ── */}
      <div className="mt-5">
        <SectionHeader icon={Shield} title="7. Risk Management" accent="text-brand-400" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-1">
              <Percent className="h-3 w-3 text-brand-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Suggested Risk</span>
            </div>
            <p className="tabular mt-1 text-sm font-bold text-brand-300">{riskManagement.suggestedRiskPct}%</p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gold-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Est. Duration</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-200">{riskManagement.estimatedDuration}</p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-bull-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">R/R Ratio</span>
            </div>
            <p className="tabular mt-1 text-sm font-bold text-bull-400">1:{riskManagement.riskRewardRatio.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Position Size</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-300">{riskManagement.positionSize ?? 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* ── 8. AI Confidence Breakdown ── */}
      <div className="mt-5">
        <SectionHeader icon={Gauge} title="8. AI Confidence Breakdown" accent="text-brand-400" />
        <div className="mt-3 space-y-2.5">
          <ConfidenceBar label="Trend Alignment" value={confidenceBreakdown.trendAlignment} accent="text-bull-400" />
          <ConfidenceBar label="Market Structure" value={confidenceBreakdown.marketStructure} accent="text-brand-400" />
          <ConfidenceBar label="Smart Money Concepts" value={confidenceBreakdown.smartMoneyConcepts} accent="text-gold-400" />
          <ConfidenceBar label="Liquidity" value={confidenceBreakdown.liquidity} accent="text-brand-300" />
          <ConfidenceBar label="Indicators" value={confidenceBreakdown.indicators} accent="text-bull-400" />
          <ConfidenceBar label="Risk Quality" value={confidenceBreakdown.riskQuality} accent="text-gold-400" />
        </div>
        <div className={`mt-3 flex items-center justify-between rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`h-5 w-5 ${cfg.text}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`tabular text-2xl font-bold ${cfg.text}`}>{confidenceBreakdown.overall}%</span>
            {isBuy && <ArrowUpRight className="h-5 w-5 text-bull-400" />}
            {isSell && <ArrowDownRight className="h-5 w-5 text-bear-400" />}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
