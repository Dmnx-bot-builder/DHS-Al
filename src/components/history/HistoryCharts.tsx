import { TrendingUp, BarChart3 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type HistoryTrade, buildEquityCurve, buildMonthlyPnl } from '../../data/history';

export function EquityCurveChart({ trades }: { trades: HistoryTrade[] }) {
  const data = buildEquityCurve(trades);
  const width = 800;
  const height = 220;
  const padX = 10;
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
  const last = points[points.length - 1];
  const totalReturn = ((data[data.length - 1] - data[0]) / data[0]) * 100;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-bull-400" />
          <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${totalReturn >= 0 ? 'bg-bull-500/10 text-bull-400' : 'bg-bear-500/10 text-bear-400'}`}>
          {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
        </span>
      </div>
      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="histEquityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16C784" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#16C784" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="histEquityStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1AAEFF" />
              <stop offset="100%" stopColor="#34E2A1" />
            </linearGradient>
            <filter id="histEquityGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path d={areaD} fill="url(#histEquityFill)" />
          <path d={pathD} fill="none" stroke="url(#histEquityStroke)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#histEquityGlow)" />
          <circle cx={last.x} cy={last.y} r="5" fill="#34E2A1" filter="url(#histEquityGlow)">
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={last.x} cy={last.y} r="3" fill="#34E2A1" />
        </svg>
      </div>
      <div className="mt-3 flex justify-between border-t border-white/[0.06] pt-3 text-xs">
        <div><span className="text-slate-500">Start:</span> <span className="tabular font-semibold text-slate-300">${data[0].toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
        <div><span className="text-slate-500">End:</span> <span className="tabular font-semibold text-bull-400">${data[data.length - 1].toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
      </div>
    </GlassCard>
  );
}

export function MonthlyPnlChart({ trades }: { trades: HistoryTrade[] }) {
  const monthly = buildMonthlyPnl(trades);
  const maxAbs = Math.max(...monthly.map((m) => Math.abs(m.pnl)), 1);
  const height = 220;
  const barWidth = 60;
  const gap = 40;
  const totalWidth = monthly.length * (barWidth + gap) + 40;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gold-400" />
          <h3 className="text-sm font-semibold text-white">Monthly P/L</h3>
        </div>
        <span className="text-[10px] text-slate-500">{monthly.length} months</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${totalWidth} ${height}`} className="h-44 w-full" style={{ minWidth: 300 }}>
          <line x1="20" y1={height / 2} x2={totalWidth - 10} y2={height / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {monthly.map((m, i) => {
            const x = 30 + i * (barWidth + gap);
            const barH = (Math.abs(m.pnl) / maxAbs) * (height / 2 - 20);
            const y = m.pnl >= 0 ? height / 2 - barH : height / 2;
            const positive = m.pnl >= 0;
            return (
              <g key={m.month}>
                <rect x={x} y={y} width={barWidth} height={barH} rx="6"
                  fill={positive ? 'url(#monthBull)' : 'url(#monthBear)'} />
                <defs>
                  <linearGradient id="monthBull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34E2A1" />
                    <stop offset="100%" stopColor="#16C784" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="monthBear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EA3943" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#FF6B81" />
                  </linearGradient>
                </defs>
                <text x={x + barWidth / 2} y={positive ? y - 8 : y + barH + 16} textAnchor="middle"
                  className="tabular" fontSize="12" fill={positive ? '#34E2A1' : '#FF6B81'} fontWeight="600">
                  {positive ? '+' : ''}${m.pnl.toFixed(0)}
                </text>
                <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748B">
                  {m.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </GlassCard>
  );
}
