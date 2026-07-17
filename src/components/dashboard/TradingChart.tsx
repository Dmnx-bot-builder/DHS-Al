import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Maximize2, Loader2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { goldMarket } from '../../data/trading';

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4'] as const;

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<string>('M15');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'OANDA:XAUUSD',
      interval: timeframe,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    script.onload = () => setLoading(false);
    container.appendChild(script);

    const timer = window.setTimeout(() => setLoading(false), 3500);
    return () => {
      window.clearTimeout(timer);
      container.innerHTML = '';
    };
  }, [timeframe]);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">XAU/USD</span>
              <span className="rounded bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-300">Gold Spot</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">Live TradingView Chart</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-bear-400" />
              <div className="leading-tight">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Bid</p>
                <p className="tabular text-sm font-semibold text-bear-400">{goldMarket.bid.toFixed(2)}</p>
              </div>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-bull-400" />
              <div className="leading-tight">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Ask</p>
                <p className="tabular text-sm font-semibold text-bull-400">{goldMarket.ask.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${timeframe === tf ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {tf}
              </button>
            ))}
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[420px] w-full">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
              <p className="text-xs text-slate-400">Loading chart…</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="grid grid-cols-4 gap-px border-t border-white/[0.06] bg-white/[0.04]">
        <div className="bg-ink-850/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Spread</p>
          <p className="tabular mt-1 text-sm font-semibold text-slate-200">{goldMarket.spread.toFixed(2)}</p>
        </div>
        <div className="bg-ink-850/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Day High</p>
          <p className="tabular mt-1 text-sm font-semibold text-bull-400">{goldMarket.high.toFixed(2)}</p>
        </div>
        <div className="bg-ink-850/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Day Low</p>
          <p className="tabular mt-1 text-sm font-semibold text-bear-400">{goldMarket.low.toFixed(2)}</p>
        </div>
        <div className="bg-ink-850/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Change</p>
          <p className="tabular mt-1 text-sm font-semibold text-bull-400">+{goldMarket.changePct.toFixed(2)}%</p>
        </div>
      </div>
    </GlassCard>
  );
}