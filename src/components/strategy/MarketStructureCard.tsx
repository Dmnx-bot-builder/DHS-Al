import { GitBranch, ArrowUp, ArrowDown } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type MarketStructurePoint } from '../../data/strategy';

const typeConfig: Record<MarketStructurePoint['type'], { text: string; bg: string; border: string; icon: typeof ArrowUp }> = {
  HH: { text: 'text-bull-400', bg: 'bg-bull-500/10', border: 'border-bull-500/30', icon: ArrowUp },
  HL: { text: 'text-bull-400', bg: 'bg-bull-500/10', border: 'border-bull-500/30', icon: ArrowUp },
  LH: { text: 'text-bear-400', bg: 'bg-bear-500/10', border: 'border-bear-500/30', icon: ArrowDown },
  LL: { text: 'text-bear-400', bg: 'bg-bear-500/10', border: 'border-bear-500/30', icon: ArrowDown },
};

export function MarketStructureCard({ points }: { points: MarketStructurePoint[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Market Structure</h3>
        </div>
        <span className="text-[10px] text-slate-500">{points.length} points</span>
      </div>

      <div className="mt-4 space-y-2">
        {points.map((p) => {
          const cfg = typeConfig[p.type];
          const Icon = cfg.icon;
          return (
            <div key={p.id} className={`flex items-center justify-between rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2.5`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${cfg.text}`}>{p.type}</p>
                  <p className="text-[10px] text-slate-500">{p.label}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-semibold text-slate-200">{p.price.toFixed(2)}</p>
                <p className="tabular text-[10px] text-slate-500">{p.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
