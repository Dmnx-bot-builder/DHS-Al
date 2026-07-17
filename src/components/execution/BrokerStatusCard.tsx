import { Server, Wifi } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { type BrokerConnection } from '../../data/execution';
import { latencyHistory } from '../../data/execution';

export function BrokerStatusCard({ broker }: { broker: BrokerConnection }) {
  const maxLatency = Math.max(...latencyHistory);
  const avgLatency = Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Broker Connection</h3>
        </div>
        <Badge variant={broker.connected ? 'success' : 'danger'} dot>{broker.connected ? 'Connected' : 'Offline'}</Badge>
      </div>

      {/* Connection status with pulse */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-bull-500/10">
          {broker.connected && <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-xl bg-bull-400/40" />}
          <Wifi className="relative h-5 w-5 text-bull-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{broker.name}</p>
          <p className="text-[10px] text-slate-500">{broker.server}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Latency</p>
          <p className="tabular text-sm font-bold text-bull-400">{broker.latencyMs}ms</p>
        </div>
      </div>

      {/* Latency graph */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Latency History</span>
          <span className="tabular text-[10px] text-slate-500">avg {avgLatency}ms</span>
        </div>
        <div className="mt-1.5 flex h-12 items-end gap-0.5">
          {latencyHistory.map((lat, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
              style={{ height: `${(lat / maxLatency) * 100}%`, opacity: 0.4 + (lat / maxLatency) * 0.6 }} />
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Login</p>
          <p className="tabular mt-0.5 text-xs font-semibold text-slate-300">{broker.login}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Leverage</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-300">{broker.leverage}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-600">Currency</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-300">{broker.currency}</p>
        </div>
      </div>
    </GlassCard>
  );
}