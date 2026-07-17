import { Zap, X, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type TradingMode, type TradingEngine, type OrderSide } from '../../data/execution';

interface OrderEntryPanelProps {
  mode: TradingMode;
  engine: TradingEngine;
  onModeChange: (m: TradingMode) => void;
  onEngineChange: (e: TradingEngine) => void;
  onBuy: (side: OrderSide) => void;
  onSell: (side: OrderSide) => void;
  onCloseAll: () => void;
  openCount: number;
  bid: number;
  ask: number;
}

export function OrderEntryPanel({ mode, engine, onModeChange, onEngineChange, onBuy, onSell, onCloseAll, openCount, bid, ask }: OrderEntryPanelProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Order Entry</h3>
        </div>
        <span className="text-[10px] text-slate-500">{openCount} open</span>
      </div>

      {/* Mode toggle: DEMO / LIVE */}
      <div className="mt-4">
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Trading Mode</p>
        <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
          <button onClick={() => onModeChange('MANUAL')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${mode === 'MANUAL' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            MANUAL
          </button>
          <button onClick={() => onModeChange('SEMI_AUTO')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${mode === 'SEMI_AUTO' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            SEMI-AUTO
          </button>
          <button onClick={() => onModeChange('FULL_AUTO')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${mode === 'FULL_AUTO' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            FULL AUTO
          </button>
        </div>
      </div>

      {/* Engine toggle */}
      <div className="mt-3">
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Engine</p>
        <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
          <button onClick={() => onEngineChange('MT5')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${engine === 'MT5' ? 'bg-gold-500 text-ink-950' : 'text-slate-400 hover:text-white'}`}>
            MT5
          </button>
          <button onClick={() => onEngineChange('CTRADER')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${engine === 'CTRADER' ? 'bg-gold-500 text-ink-950' : 'text-slate-400 hover:text-white'}`}>
            cTrader
          </button>
          <button onClick={() => onEngineChange('BROKER_API')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${engine === 'BROKER_API' ? 'bg-gold-500 text-ink-950' : 'text-slate-400 hover:text-white'}`}>
            API
          </button>
        </div>
      </div>

      {/* Bid / Ask display */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-bear-500/20 bg-bear-500/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Bid</span>
            <TrendingDown className="h-3.5 w-3.5 text-bear-400" />
          </div>
          <p className="tabular mt-1 text-lg font-bold text-bear-400">{bid.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-bull-500/20 bg-bull-500/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Ask</span>
            <TrendingUp className="h-3.5 w-3.5 text-bull-400" />
          </div>
          <p className="tabular mt-1 text-lg font-bold text-bull-400">{ask.toFixed(2)}</p>
        </div>
      </div>

      {/* BUY / SELL buttons */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onBuy('BUY')}
          className="group flex flex-col items-center gap-1 rounded-xl border border-bull-500/40 bg-bull-500/10 py-3 transition-all hover:bg-bull-500/20 hover:shadow-glow-bull">
          <TrendingUp className="h-5 w-5 text-bull-400 transition-transform group-hover:scale-110" />
          <span className="text-sm font-bold text-bull-400">BUY</span>
          <span className="tabular text-[10px] text-bull-400/60">{ask.toFixed(2)}</span>
        </button>
        <button onClick={() => onSell('SELL')}
          className="group flex flex-col items-center gap-1 rounded-xl border border-bear-500/40 bg-bear-500/10 py-3 transition-all hover:bg-bear-500/20 hover:shadow-glow-bear">
          <TrendingDown className="h-5 w-5 text-bear-400 transition-transform group-hover:scale-110" />
          <span className="text-sm font-bold text-bear-400">SELL</span>
          <span className="tabular text-[10px] text-bear-400/60">{bid.toFixed(2)}</span>
        </button>
      </div>

      {/* Close buttons */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onCloseAll}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10">
          <X className="h-3.5 w-3.5" />Close All
        </button>
        <div className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-[10px] text-slate-500">
          Spread: <span className="tabular ml-1 font-semibold text-slate-300">{(ask - bid).toFixed(2)}</span>
        </div>
      </div>
    </GlassCard>
  );
}
