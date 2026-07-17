import { Globe } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';

interface SessionInfo {
  name: string;
  city: string;
  open: string;
  close: string;
  isOpen: boolean;
}

const SESSIONS: SessionInfo[] = [
  { name: 'Sydney', city: 'SYD', open: '21:00', close: '06:00', isOpen: false },
  { name: 'Tokyo', city: 'TYO', open: '00:00', close: '09:00', isOpen: false },
  { name: 'London', city: 'LDN', open: '08:00', close: '17:00', isOpen: true },
  { name: 'New York', city: 'NYC', open: '13:00', close: '22:00', isOpen: true },
];

export function MarketStatus() {
  const openCount = SESSIONS.filter((s) => s.isOpen).length;

  const circumference = 2 * Math.PI * 54;
  const progress = (openCount / SESSIONS.length) * circumference;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Global Sessions</h3>
        </div>
        <Badge variant={openCount > 0 ? 'success' : 'neutral'} dot>{openCount} Open</Badge>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="url(#sessionGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`} className="transition-all duration-700" />
            <defs>
              <linearGradient id="sessionGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1AAEFF" />
                <stop offset="100%" stopColor="#34E2A1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-white">{openCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Open</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {SESSIONS.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span className={`relative flex h-2.5 w-2.5 ${s.isOpen ? '' : 'opacity-40'}`}>
                  {s.isOpen && <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-bull-400" />}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.isOpen ? 'bg-bull-400' : 'bg-slate-600'}`} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{s.name}</p>
                  <p className="text-[10px] text-slate-500">{s.open}–{s.close} UTC</p>
                </div>
              </div>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${s.isOpen ? 'bg-bull-500/15 text-bull-400' : 'bg-white/5 text-slate-500'}`}>
                {s.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}