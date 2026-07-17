// MarketDataStatusBar — displays live market data connection info

import { Activity, AlertTriangle, Wifi, WifiOff, Clock, TrendingUp } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import type { MarketDataState } from '../../types';

interface MarketDataStatusBarProps {
  state: MarketDataState;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'brand'; icon: typeof Wifi }> = {
  CONNECTED: { label: 'Connected', variant: 'success', icon: Wifi },
  CONNECTING: { label: 'Connecting', variant: 'warning', icon: Activity },
  DISCONNECTED: { label: 'Disconnected', variant: 'danger', icon: WifiOff },
  ERROR: { label: 'Error', variant: 'danger', icon: AlertTriangle },
};

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
}

export function MarketDataStatusBar({ state }: MarketDataStatusBarProps) {
  const { status, provider, mode, latestQuote, lastUpdated, error } = state;
  const cfg = statusConfig[status] ?? statusConfig.DISCONNECTED;
  const StatusIcon = cfg.icon;
  const isMock = mode === 'MOCK';

  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Connection status */}
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.variant === 'success' ? 'bg-bull-500/10' : cfg.variant === 'warning' ? 'bg-gold-500/10' : 'bg-bear-500/10'}`}>
            <StatusIcon className={`h-4.5 w-4.5 ${cfg.variant === 'success' ? 'text-bull-400' : cfg.variant === 'warning' ? 'text-gold-400' : 'text-bear-400'}`} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Connection</p>
            <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
          </div>
        </div>

        {/* Data mode */}
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isMock ? 'bg-gold-500/10' : 'bg-bull-500/10'}`}>
            <Activity className={`h-4.5 w-4.5 ${isMock ? 'text-gold-400' : 'text-bull-400'}`} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Data Mode</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isMock ? 'text-gold-400' : 'text-bull-400'}`}>
                {isMock ? 'MOCK MODE' : 'LIVE MARKET MODE'}
              </span>
            </div>
          </div>
        </div>

        {/* Provider */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
            <TrendingUp className="h-4.5 w-4.5 text-brand-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Provider</p>
            <span className="text-sm font-semibold text-slate-200">{provider.label}</span>
          </div>
        </div>

        {/* Current price */}
        {latestQuote && (
          <div className="flex items-center gap-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Price</p>
              <p className="tabular text-sm font-bold text-white">{latestQuote.price.toFixed(2)}</p>
            </div>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${latestQuote.changePct >= 0 ? 'bg-bull-500/15 text-bull-400' : 'bg-bear-500/15 text-bear-400'}`}>
              {latestQuote.changePct >= 0 ? '+' : ''}{latestQuote.changePct.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Spread */}
        {latestQuote && (
          <div className="hidden items-center gap-2.5 md:flex">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Spread</p>
              <p className="tabular text-sm font-semibold text-slate-300">{latestQuote.spread.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Last updated */}
        <div className="ml-auto flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Update</p>
            <p className="tabular text-sm font-medium text-slate-300">{formatTime(lastUpdated)}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold-400" />
          <p className="text-xs text-gold-300">{error}</p>
        </div>
      )}
    </GlassCard>
  );
}
