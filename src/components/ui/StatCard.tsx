import { type ReactNode } from 'react';
import { GlassCard, Badge } from './GlassCard';

const accentMap: Record<string, { text: string; ring: string; bar: string }> = {
  brand: { text: 'text-brand-300', ring: 'bg-brand-500/15', bar: 'bg-brand-500' },
  gold: { text: 'text-gold-400', ring: 'bg-gold-500/15', bar: 'bg-gold-500' },
  bull: { text: 'text-bull-400', ring: 'bg-bull-500/15', bar: 'bg-bull-500' },
  bear: { text: 'text-bear-400', ring: 'bg-bear-500/15', bar: 'bg-bear-500' },
  neutral: { text: 'text-slate-300', ring: 'bg-white/5', bar: 'bg-slate-500' },
};

export function StatCard({ label, value, icon, accent = 'neutral', delta, deltaPositive, sub, progress, delay = '', children }: {
  label: string; value: string; icon: ReactNode; accent?: 'brand'|'gold'|'bull'|'bear'|'neutral';
  delta?: string; deltaPositive?: boolean; sub?: string; progress?: number; delay?: string; children?: ReactNode;
}) {
  const a = accentMap[accent];
  return (
    <GlassCard className={`group p-5 ${delay}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.ring} ${a.text} transition-transform duration-300 group-hover:scale-110`}>{icon}</div>
        {delta !== undefined && <Badge variant={deltaPositive ? 'success' : 'danger'} className="text-[10px]">{delta}</Badge>}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className={`tabular mt-1.5 text-2xl font-semibold leading-tight ${a.text}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      {progress !== undefined && (
        <div className="mt-4"><div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5"><div className={`h-full rounded-full transition-all duration-700 ${a.bar}`} style={{ width: `${Math.min(100,Math.max(0,progress))}%` }} /></div></div>
      )}
      {children}
    </GlassCard>
  );
}
