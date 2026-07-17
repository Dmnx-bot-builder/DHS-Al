import { Check, X, Brain, TrendingUp, TrendingDown, Ban } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type AiDecision, type ReasonItem } from '../../data/strategy';

const decisionConfig: Record<AiDecision, { label: string; text: string; bg: string; border: string; icon: typeof TrendingUp }> = {
  BUY: { label: 'BUY', text: 'text-bull-400', bg: 'bg-bull-500/10', border: 'border-bull-500/40', icon: TrendingUp },
  SELL: { label: 'SELL', text: 'text-bear-400', bg: 'bg-bear-500/10', border: 'border-bear-500/40', icon: TrendingDown },
  NO_TRADE: { label: 'NO TRADE', text: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', icon: Ban },
};

const categoryLabels: Record<ReasonItem['category'], string> = {
  TREND: 'Trend',
  STRUCTURE: 'Structure',
  SMC: 'Smart Money',
  INDICATOR: 'Indicators',
  RISK: 'Risk',
  SESSION: 'Session',
};

const categoryOrder: ReasonItem['category'][] = ['TREND', 'STRUCTURE', 'SMC', 'INDICATOR', 'RISK', 'SESSION'];

interface AiDecisionPanelProps {
  decision: AiDecision;
  confidence: number;
  reasons: ReasonItem[];
}

export function AiDecisionPanel({ decision, confidence, reasons }: AiDecisionPanelProps) {
  const passedCount = reasons.filter((r) => r.passed).length;
  const activeCfg = decisionConfig[decision];

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: reasons.filter((r) => r.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">AI Decision Panel</h3>
        </div>
        <span className="text-[10px] text-slate-500">{passedCount}/{reasons.length} passed</span>
      </div>

      {/* Decision buttons */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(Object.keys(decisionConfig) as AiDecision[]).map((d) => {
          const cfg = decisionConfig[d];
          const Icon = cfg.icon;
          const isActive = decision === d;
          return (
            <button key={d}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-bold transition-all ${isActive ? `${cfg.border} ${cfg.bg} ${cfg.text}` : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300'}`}>
              <Icon className="h-4 w-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Confidence */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Confidence Score</span>
          <span className={`tabular text-sm font-bold ${activeCfg.text}`}>{confidence}%</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <div className={`h-full rounded-full transition-all duration-1000 ${activeCfg.bg.replace('/10', '')} ${activeCfg.text.replace('text-', 'bg-')}`}
            style={{ width: `${confidence}%` }} />
        </div>
      </div>

      {/* Reasons checklist */}
      <div className="mt-4 space-y-3">
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{categoryLabels[group.category]}</p>
            <div className="space-y-1">
              {group.items.map((r) => (
                <div key={r.id} className="flex items-start gap-2 rounded-lg border border-white/[0.03] bg-white/[0.02] px-2.5 py-1.5">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${r.passed ? 'bg-bull-500/15 text-bull-400' : 'bg-bear-500/15 text-bear-400'}`}>
                    {r.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <p className="flex-1 text-[11px] leading-snug text-slate-400">{r.text}</p>
                  <span className="tabular shrink-0 text-[10px] font-semibold text-slate-500">w{r.weight}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
