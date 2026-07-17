import { Layers, ArrowUpRight, ArrowDownRight, Ban, Zap, Boxes, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type SmartMoneyConcept, type SmcType } from '../../data/strategy';

const typeIcons: Record<SmcType, typeof Ban> = {
  BOS: Zap,
  CHOCH: Layers,
  SWEEP: Boxes,
  SUPPLY: TrendingDown,
  DEMAND: TrendingUp,
};

const statusConfig: Record<SmartMoneyConcept['status'], { text: string; bg: string }> = {
  CONFIRMED: { text: 'text-bull-400', bg: 'bg-bull-500/15' },
  ACTIVE: { text: 'text-brand-300', bg: 'bg-brand-500/15' },
  FORMING: { text: 'text-gold-400', bg: 'bg-gold-500/15' },
  MITIGATED: { text: 'text-slate-400', bg: 'bg-white/5' },
};

export function SmartMoneyCard({ concepts }: { concepts: SmartMoneyConcept[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Smart Money Concepts</h3>
        </div>
        <span className="text-[10px] text-slate-500">{concepts.length} active</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {concepts.map((c) => {
          const Icon = typeIcons[c.type];
          const sCfg = statusConfig[c.status];
          return (
            <div key={c.id} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-white/10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.bullish ? 'bg-bull-500/10 text-bull-400' : 'bg-bear-500/10 text-bear-400'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-200">{c.label}</p>
                      <span className={`flex items-center gap-0.5 text-[10px] font-medium ${c.bullish ? 'text-bull-400' : 'text-bear-400'}`}>
                        {c.bullish ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{c.description}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${sCfg.bg} ${sCfg.text}`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-600">{c.type}</span>
                <span className="tabular text-xs font-semibold text-slate-300">{c.price.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
