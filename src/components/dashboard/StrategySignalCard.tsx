// StrategySignalCard — Dashboard card showing live strategy event state

import { Activity, TrendingUp, TrendingDown, Ban, Clock, Bell, Hash } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { useStrategyEvents } from '../../hooks/useStrategyEvents';
import { useSignalId } from '../../hooks/useSignalId';
import type { AiDecision } from '../../data/strategy';

const decisionConfig: Record<AiDecision, { text: string; bg: string; icon: typeof TrendingUp; label: string }> = {
  BUY: { text: 'text-bull-400', bg: 'bg-bull-500/10', icon: TrendingUp, label: 'BUY' },
  SELL: { text: 'text-bear-400', bg: 'bg-bear-500/10', icon: TrendingDown, label: 'SELL' },
  NO_TRADE: { text: 'text-slate-400', bg: 'bg-white/5', icon: Ban, label: 'NO TRADE' },
};

function formatTime(ts: number | null): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function StrategySignalCard() {
  const events = useStrategyEvents();
  const signalId = useSignalId();

  const decision = events.lastDecision;
  const cfg = decision ? decisionConfig[decision] : null;
  const DecisionIcon = cfg?.icon ?? Activity;

  return (
    <GlassCard hover={false} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Strategy Signal</h3>
        </div>
        {decision && cfg && (
          <Badge variant={decision === 'BUY' ? 'success' : decision === 'SELL' ? 'danger' : 'neutral'} dot>
            {cfg.label}
          </Badge>
        )}
      </div>

      {/* Current signal */}
      <div className={`mt-3 flex items-center gap-3 rounded-xl border border-white/[0.06] ${cfg?.bg ?? 'bg-white/[0.02]'} px-3 py-2.5`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg?.bg ?? 'bg-white/5'} ${cfg?.text ?? 'text-slate-400'}`}>
          <DecisionIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Latest Signal</p>
          <p className={`text-sm font-bold ${cfg?.text ?? 'text-slate-400'}`}>
            {decision ? cfg!.label : 'Waiting for data...'}
          </p>
        </div>
        {signalId && (
          <div className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1">
            <Hash className="h-3 w-3 text-brand-300" />
            <span className="truncate text-[9px] font-mono text-slate-400">{signalId.signalId}</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-bull-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Last BUY</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">{formatTime(events.lastBuyAt)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-bear-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Last SELL</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">{formatTime(events.lastSellAt)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-brand-300" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Strategy Update</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">{formatTime(events.lastStrategyUpdate)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <Bell className="h-3 w-3 text-gold-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Last Notification</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">
            {events.lastNotificationSubtype ? events.lastNotificationSubtype.replace(/_/g, ' ') : '—'}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
