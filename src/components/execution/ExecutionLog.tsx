import { Check, X, AlertTriangle, Clock, Edit3, Info, Cpu, Terminal } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type ExecutionLogEntry, type OrderStatus } from '../../data/execution';

const statusIcons: Record<OrderStatus, { icon: typeof Check; text: string }> = {
  FILLED: { icon: Check, text: 'text-bull-400' },
  REJECTED: { icon: X, text: 'text-bear-400' },
  PARTIAL: { icon: AlertTriangle, text: 'text-gold-400' },
  PENDING: { icon: Clock, text: 'text-brand-300' },
  CANCELLED: { icon: X, text: 'text-slate-500' },
};

const typeIcons: Record<ExecutionLogEntry['type'], typeof Info> = {
  ORDER: Cpu,
  FILL: Check,
  CLOSE: X,
  MODIFY: Edit3,
  REJECT: AlertTriangle,
  INFO: Info,
  SYSTEM: Terminal,
};

export function ExecutionLog({ log }: { log: ExecutionLogEntry[] }) {
  const filled = log.filter((e) => e.status === 'FILLED').length;
  const rejected = log.filter((e) => e.status === 'REJECTED').length;

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Execution Log</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-bull-400"><Check className="h-3 w-3" />{filled} filled</span>
          <span className="flex items-center gap-1 text-bear-400"><X className="h-3 w-3" />{rejected} rejected</span>
        </div>
      </div>

      <div className="no-scrollbar max-h-[280px] overflow-y-auto p-2">
        {log.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-600">No log entries</div>
        ) : (
          <div className="space-y-1">
            {log.map((entry) => {
              const sCfg = statusIcons[entry.status];
              const SIcon = sCfg.icon;
              const TIcon = typeIcons[entry.type];
              return (
                <div key={entry.id} className="flex items-start gap-2 rounded-lg border border-white/[0.03] bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-white/10">
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${sCfg.text}`}>
                    <SIcon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TIcon className="h-3 w-3 text-slate-600" />
                      <span className="tabular text-[10px] text-slate-500">{entry.time}</span>
                      <span className={`rounded px-1 py-0.5 text-[8px] font-bold tracking-wider ${entry.status === 'FILLED' ? 'bg-bull-500/15 text-bull-400' : entry.status === 'REJECTED' ? 'bg-bear-500/15 text-bear-400' : 'bg-white/5 text-slate-400'}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-300">{entry.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
