import { Clock, Radio } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { type MarketCondition, type TradingSession } from '../../data/strategy';
import { sessionTabs } from '../../data/strategy';

const conditionConfig: Record<MarketCondition, { label: string; text: string; bg: string; desc: string }> = {
  TRENDING: { label: 'Trending', text: 'text-bull-400', bg: 'bg-bull-500/10', desc: 'Clear directional bias with HH/HL structure. Trend-following strategies optimal.' },
  RANGING: { label: 'Ranging', text: 'text-gold-400', bg: 'bg-gold-500/10', desc: 'Price consolidating between support and resistance. Mean-reversion strategies preferred.' },
  VOLATILE: { label: 'Volatile', text: 'text-bear-400', bg: 'bg-bear-500/10', desc: 'High volatility with expanded ranges. Reduce position size, widen stops.' },
  CHOPPY: { label: 'Choppy', text: 'text-slate-400', bg: 'bg-white/5', desc: 'Erratic price action without clear direction. Best to stand aside.' },
};

interface SessionConditionCardProps {
  session: TradingSession;
  marketCondition: MarketCondition;
}

export function SessionConditionCard({ session, marketCondition }: SessionConditionCardProps) {
  const cfg = conditionConfig[marketCondition];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Session & Condition</h3>
        </div>
        <Badge variant="brand" dot>Active</Badge>
      </div>

      {/* Session tabs */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {sessionTabs.map((tab) => {
          const isActive = session === tab.id;
          return (
            <div key={tab.id}
              className={`rounded-lg border px-3 py-2.5 transition-all ${isActive ? 'border-brand-500/40 bg-brand-500/10' : 'border-white/[0.04] bg-white/[0.02]'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isActive ? 'text-brand-300' : 'text-slate-400'}`}>{tab.label}</span>
                {tab.active && (
                  <span className="flex items-center gap-1">
                    <Radio className="h-3 w-3 text-bull-400" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bull-400" />
                  </span>
                )}
              </div>
              <p className="tabular mt-0.5 text-[10px] text-slate-500">{tab.time}</p>
            </div>
          );
        })}
      </div>

      {/* Market condition */}
      <div className={`mt-4 rounded-xl border border-white/[0.06] ${cfg.bg} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${cfg.text}`} />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Market Condition</span>
          </div>
          <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{cfg.desc}</p>
      </div>
    </GlassCard>
  );
}
