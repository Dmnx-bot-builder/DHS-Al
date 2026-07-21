// SymbolSelector — dropdown to change the ONE active trading symbol.
// When the symbol changes here, every component in the app updates
// because they all read from the global MarketStoreProvider.

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  SUPPORTED_SYMBOLS, useMarketStore, getSymbolLabel, getSymbolCategory,
} from '../../store/marketStore';

export function SymbolSelector() {
  const { symbol, setSymbol } = useMarketStore();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = SUPPORTED_SYMBOLS.filter(
    (s) => s.symbol.toLowerCase().includes(filter.toLowerCase())
      || s.label.toLowerCase().includes(filter.toLowerCase()),
  );

  const categories = [...new Set(filtered.map((s) => s.category))];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
      >
        <span className="tabular">{symbol}</span>
        <span className="text-[10px] text-slate-500">{getSymbolLabel(symbol)}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-ink-850/95 p-2 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/5 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search symbols..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
            />
          </div>

          {categories.map((cat) => (
            <div key={cat} className="mb-1">
              <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-600">{cat}</p>
              {filtered.filter((s) => s.category === cat).map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => {
                    setSymbol(s.symbol);
                    setOpen(false);
                    setFilter('');
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                    symbol === s.symbol
                      ? 'bg-brand-500/15 text-brand-300'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{s.symbol}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-600">{getSymbolCategory(s.symbol)}</span>
                </button>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-slate-500">No symbols found</p>
          )}
        </div>
      )}
    </div>
  );
}