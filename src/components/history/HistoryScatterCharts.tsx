import { ScatterChart, BarChart3 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type HistoryTrade } from '../../data/history';

export function ConfidencePnlChart({ trades }: { trades: HistoryTrade[] }) {
  const width = 500;
  const height = 240;
  const padL = 40;
  const padB = 30;
  const padT = 15;
  const padR = 15;

  const minConf = 50;
  const maxConf = 100;
  const maxPnl = Math.max(...trades.map((t) => Math.abs(t.netPnl)), 1);

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const midY = padT + plotH / 2;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScatterChart className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Confidence vs P/L</h3>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
          {/* Axes */}
          <line x1={padL} y1={midY} x2={width - padR} y2={midY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const y = padT + p * plotH;
            return <line key={p} x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
          })}

          {/* Y labels */}
          <text x={padL - 6} y={padT + 8} textAnchor="end" fontSize="9" fill="#64748B">+${maxPnl.toFixed(0)}</text>
          <text x={padL - 6} y={midY + 3} textAnchor="end" fontSize="9" fill="#64748B">$0</text>
          <text x={padL - 6} y={height - padB} textAnchor="end" fontSize="9" fill="#64748B">-${maxPnl.toFixed(0)}</text>

          {/* X labels */}
          <text x={padL} y={height - padB + 16} textAnchor="middle" fontSize="9" fill="#64748B">{minConf}%</text>
          <text x={padL + plotW / 2} y={height - padB + 16} textAnchor="middle" fontSize="9" fill="#64748B">75%</text>
          <text x={width - padR} y={height - padB + 16} textAnchor="middle" fontSize="9" fill="#64748B">{maxConf}%</text>

          {/* Points */}
          {trades.map((t) => {
            const x = padL + ((t.confidence - minConf) / (maxConf - minConf)) * plotW;
            const y = midY - (t.netPnl / maxPnl) * (plotH / 2);
            const positive = t.netPnl >= 0;
            return (
              <circle key={t.id} cx={x} cy={y} r="3.5"
                fill={positive ? '#34E2A1' : t.netPnl === 0 ? '#F5B544' : '#FF6B81'}
                fillOpacity="0.7" stroke={positive ? '#16C784' : t.netPnl === 0 ? '#D4952C' : '#EA3943'} strokeWidth="1" />
            );
          })}

          {/* Axis titles */}
          <text x={width / 2} y={height - 2} textAnchor="middle" fontSize="9" fill="#475569">Confidence %</text>
        </svg>
      </div>
    </GlassCard>
  );
}

export function PipsDistributionChart({ trades }: { trades: HistoryTrade[] }) {
  const width = 500;
  const height = 240;
  const padL = 40;
  const padB = 30;
  const padT = 15;
  const padR = 15;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Define pip ranges
  const ranges = [
    { label: '<-50', min: -Infinity, max: -50 },
    { label: '-50..-25', min: -50, max: -25 },
    { label: '-25..0', min: -25, max: 0 },
    { label: '0..25', min: 0, max: 25 },
    { label: '25..50', min: 25, max: 50 },
    { label: '50..75', min: 50, max: 75 },
    { label: '>75', min: 75, max: Infinity },
  ];

  const counts = ranges.map((r) => trades.filter((t) => t.pips >= r.min && t.pips < r.max).length);
  const maxCount = Math.max(...counts, 1);
  const barW = plotW / ranges.length;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gold-400" />
          <h3 className="text-sm font-semibold text-white">Pips Distribution</h3>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
          {/* Y axis */}
          <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {/* X axis */}
          <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {ranges.map((r, i) => {
            const count = counts[i];
            const barH = (count / maxCount) * plotH;
            const x = padL + i * barW + 4;
            const y = height - padB - barH;
            const isNegative = i < 3;
            return (
              <g key={r.label}>
                <rect x={x} y={y} width={barW - 8} height={barH} rx="4"
                  fill={isNegative ? 'url(#pipBear)' : 'url(#pipBull)'} />
                <defs>
                  <linearGradient id="pipBull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34E2A1" />
                    <stop offset="100%" stopColor="#16C784" stopOpacity="0.5" />
                  </linearGradient>
                  <linearGradient id="pipBear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B81" />
                    <stop offset="100%" stopColor="#EA3943" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                {count > 0 && (
                  <text x={x + (barW - 8) / 2} y={y - 4} textAnchor="middle" fontSize="10" fill={isNegative ? '#FF6B81' : '#34E2A1'} fontWeight="600">
                    {count}
                  </text>
                )}
                <text x={x + (barW - 8) / 2} y={height - padB + 14} textAnchor="middle" fontSize="8" fill="#64748B">
                  {r.label}
                </text>
              </g>
            );
          })}

          <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="9" fill="#64748B">{maxCount}</text>
          <text x={padL - 6} y={height - padB} textAnchor="end" fontSize="9" fill="#64748B">0</text>
        </svg>
      </div>
    </GlassCard>
  );
}