import { Brain, Cpu, Zap, Activity, Signal } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';

const BARS = [40, 65, 30, 80, 50, 90, 45, 70, 55, 85, 35, 60, 75, 40, 95, 50, 65, 30, 80, 55];

export function AiStatus() {
  const confidence = 87;

  const circumference = 2 * Math.PI * 40;
  const progress = (confidence / 100) * circumference;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">AI Engine Status</h3>
        </div>
        <Badge variant="success" dot>ONLINE</Badge>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="url(#aiGrad)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`} className="transition-all duration-1000" />
            <defs>
              <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1AAEFF" />
                <stop offset="100%" stopColor="#4DC1FF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-bold text-white">{confidence}%</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Signal</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2">
          <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-[11px] text-slate-400">Model</span>
            </div>
            <span className="text-xs font-semibold text-white">DHS-v4.2</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-gold-400" />
              <span className="text-[11px] text-slate-400">Latency</span>
            </div>
            <span className="tabular text-xs font-semibold text-white">38ms</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
            <div className="flex items-center gap-2">
              <Signal className="h-3.5 w-3.5 text-bull-400" />
              <span className="text-[11px] text-slate-400">Signals</span>
            </div>
            <span className="tabular text-xs font-semibold text-white">14 / hr</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-brand-400" />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Neural Activity</span>
        </div>
        <div className="mt-2 flex h-12 items-end gap-1">
          {BARS.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-brand-400"
              style={{ height: `${h}%`, animation: `pulse 1.5s ease-in-out ${i * 0.08}s infinite alternate` }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; transform: scaleY(0.7); }
          100% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </GlassCard>
  );
}