import { TrendingUp, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { equityCurve, formatCurrency } from '../../data/trading';

export function PerformanceGraph() {
  const data = equityCurve;
  const width = 800;
  const height = 240;
  const padX = 8;
  const padY = 20;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (v - min) / range) * (height - padY * 2);
    return { x, y, value: v };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${height - padY} L ${points[0].x.toFixed(2)} ${height - padY} Z`;

  const start = data[0];
  const peak = Math.max(...data);
  const current = data[data.length - 1];
  const maxDD = Math.min(...data);
  const totalReturn = ((current - start) / start) * 100;

  const lastPoint = points[points.length - 1];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-bull-400" />
          <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">24h</span>
          <span className="flex items-center gap-1 rounded-full bg-bull-500/10 px-2 py-0.5 text-[11px] font-semibold text-bull-400">
            <ArrowUp className="h-3 w-3" />+{totalReturn.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16C784" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#16C784" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="equityStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1AAEFF" />
              <stop offset="100%" stopColor="#34E2A1" />
            </linearGradient>
            <filter id="equityGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path d={areaD} fill="url(#equityFill)" />
          <path d={pathD} fill="none" stroke="url(#equityStroke)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#equityGlow)" />

          <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill="#34E2A1" filter="url(#equityGlow)">
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="#34E2A1" />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 border-t border-white/[0.06] pt-4">
        <div>
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500"><Activity className="h-3 w-3" />Start</p>
          <p className="tabular mt-1 text-sm font-semibold text-slate-300">{formatCurrency(start, 0)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500"><ArrowUp className="h-3 w-3 text-bull-400" />Peak</p>
          <p className="tabular mt-1 text-sm font-semibold text-bull-400">{formatCurrency(peak, 0)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500"><TrendingUp className="h-3 w-3 text-brand-400" />Current</p>
          <p className="tabular mt-1 text-sm font-semibold text-brand-300">{formatCurrency(current)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500"><ArrowDown className="h-3 w-3 text-bear-400" />Max DD</p>
          <p className="tabular mt-1 text-sm font-semibold text-bear-400">{formatCurrency(maxDD, 0)}</p>
        </div>
      </div>
    </GlassCard>
  );
}
