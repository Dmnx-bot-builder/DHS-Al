import { TrendingUp } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface Props {
  equityCurve: number[];
  initialBalance: number;
}

export function BacktestEquityCurve({ equityCurve, initialBalance }: Props) {
  const width = 800;
  const height = 260;
  const padL = 56, padR = 20, padT = 20, padB = 28;
  const cw = width - padL - padR;
  const ch = height - padT - padB;

  const minVal = Math.min(...equityCurve, initialBalance);
  const maxVal = Math.max(...equityCurve, initialBalance);
  const range = maxVal - minVal || 1;
  const pad = range * 0.08;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;
  const yRange = yMax - yMin;

  const xStep = cw / (equityCurve.length - 1 || 1);

  const points = equityCurve.map((v, i) => ({
    x: padL + i * xStep,
    y: padT + ch - ((v - yMin) / yRange) * ch,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${padL + cw} ${padT + ch} L ${padL} ${padT + ch} Z`;

  const startVal = equityCurve[0];
  const endVal = equityCurve[equityCurve.length - 1];
  const peak = Math.max(...equityCurve);
  const profit = endVal - startVal;
  const isProfit = profit >= 0;

  const yTicks = 5;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (yRange * i) / yTicks);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bull-500/15 text-bull-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
            <p className="text-[11px] text-slate-500">Account balance over backtest period</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`tabular text-lg font-semibold ${isProfit ? 'text-bull-400' : 'text-bear-400'}`}>
            ${endVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-[11px] ${isProfit ? 'text-bull-400' : 'text-bear-400'}`}>
            {isProfit ? '+' : ''}${profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 500 }}>
          <defs>
            <linearGradient id="btEquityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isProfit ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'} />
              <stop offset="100%" stopColor={isProfit ? 'rgba(34,197,94,0)' : 'rgba(239,68,68,0)'} />
            </linearGradient>
            <filter id="btEquityGlow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {tickVals.map((v, i) => {
            const y = padT + ch - ((v - yMin) / yRange) * ch;
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={padL + cw} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x={padL - 8} y={y + 3} textAnchor="end" className="fill-slate-500" style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                  ${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#btEquityFill)" />
          <path d={linePath} fill="none" stroke={isProfit ? '#22c55e' : '#ef4444'} strokeWidth="2" filter="url(#btEquityGlow)" />

          {points.length > 0 && (
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={isProfit ? '#22c55e' : '#ef4444'}>
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
            </circle>
          )}

          <line x1={padL} y1={padT + ch - ((startVal - yMin) / yRange) * ch} x2={padL + cw} y2={padT + ch - ((startVal - yMin) / yRange) * ch} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
        <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Start Balance</p><p className="tabular mt-0.5 text-sm font-semibold text-slate-300">${startVal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Peak Balance</p><p className="tabular mt-0.5 text-sm font-semibold text-bull-400">${peak.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Final Balance</p><p className={`tabular mt-0.5 text-sm font-semibold ${isProfit ? 'text-bull-400' : 'text-bear-400'}`}>${endVal.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p></div>
      </div>
    </GlassCard>
  );
}
