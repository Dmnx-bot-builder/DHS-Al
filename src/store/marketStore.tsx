// Global Market Store — single source of truth for the active trading symbol.
// Every component reads the active symbol from this store.
// When the symbol changes here, every consumer (Header, Dashboard, Strategy
// Engine, Trade Report, Market Structure, Notifications, Signal Lifecycle,
// Analytics, History) updates automatically.
//
// Architecture:
//   MarketDataService (singleton) ← only service that calls TwelveData
//        ↓ publishes to
//   MarketCacheService (singleton) ← shared cache
//        ↓ consumed by
//   GlobalMarketStore (React Context) ← active symbol + timeframe state
//        ↓ read by
//   Every component (via useGlobalSymbol / useGlobalTimeframe hooks)
//
// This store does NOT replace MarketDataService or MarketCacheService.
// It coordinates the ONE active symbol across the entire UI.

import {
  createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode,
} from 'react';
import { marketDataService } from '../services/marketDataService';
import type { Timeframe } from '../types';

export const SUPPORTED_SYMBOLS = [
  { symbol: 'XAU/USD', label: 'Gold Spot', tvSymbol: 'OANDA:XAUUSD', category: 'Metals' },
  { symbol: 'GBP/USD', label: 'Cable', tvSymbol: 'OANDA:GBPUSD', category: 'Forex' },
  { symbol: 'EUR/USD', label: 'Euro', tvSymbol: 'OANDA:EURUSD', category: 'Forex' },
  { symbol: 'USD/JPY', label: 'Yen', tvSymbol: 'OANDA:USDJPY', category: 'Forex' },
  { symbol: 'BTC/USD', label: 'Bitcoin', tvSymbol: 'BINANCE:BTCUSDT', category: 'Crypto' },
  { symbol: 'WTI/USD', label: 'Crude Oil', tvSymbol: 'TVC:USOIL', category: 'Commodities' },
] as const;

export const SUPPORTED_TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

const STORAGE_KEY = 'dhs-ai-active-symbol';
const TF_STORAGE_KEY = 'dhs-ai-active-timeframe';

function loadSymbol(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && SUPPORTED_SYMBOLS.some((s) => s.symbol === raw)) return raw;
  } catch { /* ignore */ }
  return 'XAU/USD';
}

function loadTimeframe(): Timeframe {
  try {
    const raw = localStorage.getItem(TF_STORAGE_KEY);
    if (raw && SUPPORTED_TIMEFRAMES.includes(raw as Timeframe)) return raw as Timeframe;
  } catch { /* ignore */ }
  return 'M15';
}

interface MarketStoreValue {
  symbol: string;
  timeframe: Timeframe;
  setSymbol: (symbol: string) => void;
  setTimeframe: (tf: Timeframe) => void;
}

const MarketStoreContext = createContext<MarketStoreValue | null>(null);

export function MarketStoreProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbolState] = useState<string>(loadSymbol);
  const [timeframe, setTimeframeState] = useState<Timeframe>(loadTimeframe);

  // Start the singleton MarketDataService with the active symbol/timeframe.
  // This is the ONLY place that calls start() — components just read state.
  useEffect(() => {
    marketDataService.start(symbol, timeframe);
  }, [symbol, timeframe]);

  const setSymbol = useCallback((next: string) => {
    if (!SUPPORTED_SYMBOLS.some((s) => s.symbol === next)) return;
    setSymbolState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const setTimeframe = useCallback((tf: Timeframe) => {
    if (!SUPPORTED_TIMEFRAMES.includes(tf)) return;
    setTimeframeState(tf);
    try { localStorage.setItem(TF_STORAGE_KEY, tf); } catch { /* ignore */ }
  }, []);

  const value = useMemo<MarketStoreValue>(
    () => ({ symbol, timeframe, setSymbol, setTimeframe }),
    [symbol, timeframe, setSymbol, setTimeframe],
  );

  return <MarketStoreContext.Provider value={value}>{children}</MarketStoreContext.Provider>;
}

export function useGlobalSymbol(): string {
  const ctx = useContext(MarketStoreContext);
  if (!ctx) throw new Error('useGlobalSymbol must be used within MarketStoreProvider');
  return ctx.symbol;
}

export function useGlobalTimeframe(): Timeframe {
  const ctx = useContext(MarketStoreContext);
  if (!ctx) throw new Error('useGlobalTimeframe must be used within MarketStoreProvider');
  return ctx.timeframe;
}

export function useMarketStore(): MarketStoreValue {
  const ctx = useContext(MarketStoreContext);
  if (!ctx) throw new Error('useMarketStore must be used within MarketStoreProvider');
  return ctx;
}

export function getSymbolLabel(symbol: string): string {
  return SUPPORTED_SYMBOLS.find((s) => s.symbol === symbol)?.label ?? symbol;
}

export function getSymbolTvSymbol(symbol: string): string {
  return SUPPORTED_SYMBOLS.find((s) => s.symbol === symbol)?.tvSymbol ?? 'OANDA:XAUUSD';
}

export function getSymbolCategory(symbol: string): string {
  return SUPPORTED_SYMBOLS.find((s) => s.symbol === symbol)?.category ?? 'Unknown';
}