import { X, Layers } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type OpenPosition } from '../../data/execution';

interface OpenPositionsTableProps {
  positions: OpenPosition[];
  onClose: (id: string) => void;
}

export function OpenPositionsTable({ positions, onClose }: OpenPositionsTableProps) {
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPositive = totalPnl >= 0;

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Open Positions</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{positions.length} positions</span>
          <span className={`tabular rounded-full px-2 py-0.5 text-[11px] font-semibold ${totalPositive ? 'bg-bull-500/10 text-bull-400' : 'bg-bear-500/10 text-bear-400'}`}>
            {totalPositive ? '+' : ''}{totalPnl.toFixed(2)}
          </span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-slate-600">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-medium">Ticket</th>
                <th className="px-3 py-2.5 font-medium">Side</th>
                <th className="px-3 py-2.5 text-right font-medium">Lots</th>
                <th className="px-3 py-2.5 text-right font-medium">Entry</th>
                <th className="px-3 py-2.5 text-right font-medium">Current</th>
                <th className="px-3 py-2.5 text-right font-medium">SL</th>
                <th className="px-3 py-2.5 text-right font-medium">TP</th>
                <th className="px-3 py-2.5 text-right font-medium">P/L</th>
                <th className="px-3 py-2.5 text-right font-medium">Pips</th>
                <th className="px-3 py-2.5 text-right font-medium">Swap</th>
                <th className="px-3 py-2.5 font-medium">Strategy</th>
                <th className="px-3 py-2.5 font-medium">Mode</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const isBuy = p.side === 'BUY';
                const pnlPositive = p.pnl >= 0;
                return (
                  <tr key={p.id} className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]">
                    <td className="tabular px-4 py-2.5 font-medium text-slate-300">#{p.ticket}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isBuy ? 'bg-bull-500/15 text-bull-400' : 'bg-bear-500/15 text-bear-400'}`}>
                        {p.side}
                      </span>
                    </td>
                    <td className="tabular px-3 py-2.5 text-right text-slate-300">{p.lotSize.toFixed(2)}</td>
                    <td className="tabular px-3 py-2.5 text-right text-slate-300">{p.entryPrice.toFixed(2)}</td>
                    <td className="tabular px-3 py-2.5 text-right text-slate-400">{p.currentPrice.toFixed(2)}</td>
                    <td className="tabular px-3 py-2.5 text-right text-bear-400/80">{p.stopLoss.toFixed(2)}</td>
                    <td className="tabular px-3 py-2.5 text-right text-bull-400/80">{p.takeProfit.toFixed(2)}</td>
                    <td className={`tabular px-3 py-2.5 text-right font-semibold ${pnlPositive ? 'text-bull-400' : 'text-bear-400'}`}>
                      {pnlPositive ? '+' : ''}{p.pnl.toFixed(2)}
                    </td>
                    <td className={`tabular px-3 py-2.5 text-right ${pnlPositive ? 'text-bull-400/70' : 'text-bear-400/70'}`}>
                      {p.pips > 0 ? '+' : ''}{p.pips.toFixed(1)}
                    </td>
                    <td className="tabular px-3 py-2.5 text-right text-slate-500">{p.swap.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-slate-400">{p.strategy}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">{p.mode.replace('_', '-')}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => onClose(p.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-bear-500/30 bg-bear-500/10 text-bear-400 transition-all hover:bg-bear-500/20">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}