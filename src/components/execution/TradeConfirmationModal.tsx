import { useEffect } from 'react';
import { AlertTriangle, X, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { type OrderSide, type TradingMode } from '../../data/execution';

interface TradeConfirmationModalProps {
  open: boolean;
  side: OrderSide;
  mode: TradingMode;
  lotSize: number;
  stopLoss: number;
  takeProfit: number;
  entryPrice: number;
  riskAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TradeConfirmationModal({ open, side, mode, lotSize, stopLoss, takeProfit, entryPrice, riskAmount, onConfirm, onCancel }: TradeConfirmationModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const isBuy = side === 'BUY';
  const slPrice = isBuy ? entryPrice - stopLoss : entryPrice + stopLoss;
  const tpPrice = isBuy ? entryPrice + takeProfit : entryPrice - takeProfit;
  const maxLoss = riskAmount;
  const maxProfit = riskAmount * (takeProfit / stopLoss || 0);
  const isLive = mode === 'FULL_AUTO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-fade-in-scale rounded-2xl border border-white/10 bg-ink-850/90 shadow-glass">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
          <div className="flex items-center gap-2">
            {isBuy ? <TrendingUp className="h-5 w-5 text-bull-400" /> : <TrendingDown className="h-5 w-5 text-bear-400" />}
            <h3 className="text-sm font-bold text-white">Confirm Order</h3>
          </div>
          <button onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {/* Order summary */}
          <div className={`rounded-xl border p-3 ${isBuy ? 'border-bull-500/30 bg-bull-500/5' : 'border-bear-500/30 bg-bear-500/5'}`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Symbol</p>
                <p className="mt-0.5 text-sm font-bold text-white">XAU/USD</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Direction</p>
                <p className={`mt-0.5 text-sm font-bold ${isBuy ? 'text-bull-400' : 'text-bear-400'}`}>{side}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Volume</p>
                <p className="tabular mt-0.5 text-sm font-bold text-white">{lotSize.toFixed(2)} lots</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Entry Price</p>
                <p className="tabular mt-0.5 text-sm font-bold text-white">{entryPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* SL / TP */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-bear-500/20 bg-bear-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Stop Loss</p>
              <p className="tabular mt-1 text-sm font-bold text-bear-400">{slPrice.toFixed(2)}</p>
              <p className="tabular mt-0.5 text-[10px] text-slate-600">{stopLoss} pips</p>
            </div>
            <div className="rounded-lg border border-bull-500/20 bg-bull-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Take Profit</p>
              <p className="tabular mt-1 text-sm font-bold text-bull-400">{tpPrice.toFixed(2)}</p>
              <p className="tabular mt-0.5 text-[10px] text-slate-600">{takeProfit} pips</p>
            </div>
          </div>

          {/* Projection */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Max Loss</p>
              <p className="tabular mt-1 text-base font-bold text-bear-400">-${maxLoss.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Max Profit</p>
              <p className="tabular mt-1 text-base font-bold text-bull-400">+${maxProfit.toFixed(2)}</p>
            </div>
          </div>

          {/* LIVE warning */}
          {isLive && (
            <div className="flex items-center gap-2 rounded-lg border border-bear-500/30 bg-bear-500/10 p-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-bear-400" />
              <p className="text-[11px] font-medium text-bear-400">LIVE mode: This order will execute with real funds.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-white/[0.06] p-4">
          <button onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition-all ${isBuy ? 'bg-bull-500 hover:bg-bull-400 hover:shadow-glow-bull' : 'bg-bear-500 hover:bg-bear-400 hover:shadow-glow-bear'}`}>
            <span className="flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4" />
              Execute {side}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
