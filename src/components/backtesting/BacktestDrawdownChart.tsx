import { TrendingDown } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface Props {
  drawdown: number[];
  maxDrawdownPct: number;
}

export function BacktestDrawdownChart({ drawdown, maxDrawdownPct }: Props) {
  const width = 800;
  const height = 200;
  const padL = 48, padR = 20, padT = 16, padB = 24;
  const cw = width - padL - padR;
  const ch = height - padT - padB;

  const maxDD = Math.max(...drawdown, 0.01);
  const xStep = cw / (drawdown.length - 1 || 1);

  const points = drawdown.map((v, i) => ({
    x: padL + i * xStep,
    y: padT + (v / maxDD) * ch,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${padL + cw} ${padT} L ${padL} ${padT} Z`;

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxDD * i) / yTicks);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bear-500/15 text-bear-400">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Drawdown Chart</h3>
            <p className="text-[11px] text-slate-500">Peak-to-trough decline (%)</p>
          </div>
        </div>
        <div className="text-right">
          <p className="tabular text-lg font-semibold text-bear-400">{maxDrawdownPct.toFixed(2)}%</p>
          <p className="text-[11px] text-slate-500">Max Drawdown</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 500 }}>
          <defs>
            <linearGradient id="btDDFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(239,68,68,0)" />
              <stop offset="100%" stopColor="rgba(239,68,68,0.3)" />
            </linearGradient>
          </defs>

          {tickVals.map((v, i) => {
            const y = padT + (v / maxDD) * ch;
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={padL + cw} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500" style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                  {v.toFixed(1)}%
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#btDDFill)" />
          <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />
        </svg>
      </div>
    </GlassCard>
  );
}
