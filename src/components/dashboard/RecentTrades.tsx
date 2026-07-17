import { History } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { trades, type Trade } from '../../data/trading';

export function RecentTrades() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Recent Trades</h3>
        </div>
        <span className="text-[10px] text-slate-500">{trades.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5 font-medium">Ticket</th>
              <th className="px-3 py-2.5 font-medium">Side</th>
              <th className="px-3 py-2.5 text-right font-medium">Lots</th>
              <th className="px-3 py-2.5 text-right font-medium">Entry</th>
              <th className="px-3 py-2.5 text-right font-medium">Cur/Exit</th>
              <th className="px-3 py-2.5 text-right font-medium">SL</th>
              <th className="px-3 py-2.5 text-right font-medium">TP</th>
              <th className="px-3 py-2.5 text-right font-medium">P/L</th>
              <th className="px-3 py-2.5 text-right font-medium">Pips</th>
              <th className="px-3 py-2.5 font-medium">Strategy</th>
              <th className="px-3 py-2.5 text-right font-medium">Conf</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t: Trade) => {
              const isBuy = t.side === 'BUY';
              const pnlPositive = t.pnl > 0;
              const pnlNegative = t.pnl < 0;
              const currentOrExit = t.currentPrice ?? t.exitPrice ?? '—';
              return (
                <tr key={t.id} className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]">
                  <td className="tabular px-4 py-2.5 font-medium text-slate-300">#{t.id.replace('t', '')}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isBuy ? 'bg-bull-500/15 text-bull-400' : 'bg-bear-500/15 text-bear-400'}`}>
                      {t.side}
                    </span>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right text-slate-300">{t.lotSize.toFixed(2)}</td>
                  <td className="tabular px-3 py-2.5 text-right text-slate-300">{t.entryPrice.toFixed(2)}</td>
                  <td className="tabular px-3 py-2.5 text-right text-slate-400">{typeof currentOrExit === 'number' ? currentOrExit.toFixed(2) : currentOrExit}</td>
                  <td className="tabular px-3 py-2.5 text-right text-bear-400/80">{t.stopLoss.toFixed(2)}</td>
                  <td className="tabular px-3 py-2.5 text-right text-bull-400/80">{t.takeProfit.toFixed(2)}</td>
                  <td className={`tabular px-3 py-2.5 text-right font-semibold ${pnlPositive ? 'text-bull-400' : pnlNegative ? 'text-bear-400' : 'text-slate-400'}`}>
                    {pnlPositive ? '+' : ''}{t.pnl.toFixed(2)}
                  </td>
                  <td className={`tabular px-3 py-2.5 text-right ${pnlPositive ? 'text-bull-400/70' : pnlNegative ? 'text-bear-400/70' : 'text-slate-500'}`}>
                    {t.pips > 0 ? '+' : ''}{t.pips.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{t.strategy}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="tabular text-slate-300">{t.confidence}%</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${t.status === 'OPEN' ? 'bg-brand-500/15 text-brand-300' : t.result === 'WIN' ? 'bg-bull-500/15 text-bull-400' : t.result === 'LOSS' ? 'bg-bear-500/15 text-bear-400' : 'bg-white/5 text-slate-400'}`}>
                      {t.status === 'OPEN' ? 'OPEN' : t.result}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
