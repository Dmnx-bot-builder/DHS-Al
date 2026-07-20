// DebugPanel - Developer diagnostics panel.
// Displays: Current Provider, Connection State, Polling Status, Polling Interval,
// Cache Age, Last Request Duration, Rate Limit State, Retry Countdown,
// Cache Subscribers, Current Market Symbol, Last Error.
// Hidden behind a Developer toggle.

import { useState } from 'react';
import {
  Bug, ChevronDown, ChevronUp, Server, Wifi, Radio, Timer,
  Database, Clock, AlertTriangle, Hourglass, Users, CandlestickChart,
} from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import type { ConnectionStatus, PollingStatus, RateLimitState } from '../../types';

const connectionConfig: Record<ConnectionStatus, { variant: 'success' | 'danger' | 'warning' | 'neutral' | 'brand' }> = {
  CONNECTED: { variant: 'success' },
  CONNECTING: { variant: 'warning' },
  DISCONNECTED: { variant: 'danger' },
  ERROR: { variant: 'danger' },
  OFFLINE: { variant: 'neutral' },
};

const pollingConfig: Record<PollingStatus, { variant: 'success' | 'warning' | 'danger' }> = {
  ACTIVE: { variant: 'success' },
  PAUSED: { variant: 'warning' },
  STOPPED: { variant: 'danger' },
};

const rateLimitConfig: Record<RateLimitState, { variant: 'success' | 'warning' | 'danger' }> = {
  OK: { variant: 'success' },
  LIMITED: { variant: 'warning' },
  COOLDOWN: { variant: 'danger' },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatCacheAge(ms: number | null): string {
  if (ms === null) return '-';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

export function DebugPanel() {
  const { debug } = useConnectionStatus();
  const [expanded, setExpanded] = useState(false);

  const connCfg = connectionConfig[debug.connectionState];
  const pollCfg = pollingConfig[debug.pollingStatus];
  const rlCfg = rateLimitConfig[debug.rateLimitState];

  return (
    <GlassCard className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2"
      >
        <Bug className="h-4 w-4 text-brand-400" />
        <h3 className="text-sm font-semibold text-white">Developer Diagnostics</h3>
        <Badge variant="neutral" className="ml-auto text-[10px]">
          {debug.cacheSubscribers} subscriber{debug.cacheSubscribers !== 1 ? 's' : ''}
        </Badge>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {/* Current Provider */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Provider</p>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-slate-200">{debug.provider.label}</p>
          </div>

          {/* Connection State */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Connection</p>
            </div>
            <div className="mt-1">
              <Badge variant={connCfg.variant} dot>{debug.connectionState}</Badge>
            </div>
          </div>

          {/* Polling Status */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Polling</p>
            </div>
            <div className="mt-1">
              <Badge variant={pollCfg.variant} dot>{debug.pollingStatus}</Badge>
            </div>
          </div>

          {/* Polling Interval */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Polling Interval</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">{(debug.pollingIntervalMs / 1000).toFixed(0)}s</p>
          </div>

          {/* Cache Age */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Cache Age</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">{formatCacheAge(debug.cacheAgeMs)}</p>
          </div>

          {/* Last Request Duration */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Request Duration</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">{formatDuration(debug.lastRequestDurationMs)}</p>
          </div>

          {/* Rate Limit State */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Rate Limit</p>
            </div>
            <div className="mt-1">
              <Badge variant={rlCfg.variant} dot>{debug.rateLimitState}</Badge>
            </div>
          </div>

          {/* Retry Countdown */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Hourglass className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Retry Countdown</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {debug.retryCountdownSeconds !== null ? `${debug.retryCountdownSeconds}s` : '-'}
            </p>
          </div>

          {/* Cache Subscribers */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Cache Subscribers</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">{debug.cacheSubscribers}</p>
          </div>

          {/* Current Market Symbol */}
          <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <CandlestickChart className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Current Symbol</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">{debug.currentSymbol}</p>
          </div>

          {/* Last Error */}
          <div className="col-span-2 rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5 sm:col-span-3 lg:col-span-4">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Error</p>
            </div>
            <p className="mt-1 text-xs text-slate-300">{debug.lastError ?? 'None'}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
