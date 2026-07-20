// ConnectionStatusCard — detailed market connection status with manual controls.
// Renders on the dashboard below MarketDataStatusBar.

import { useState } from 'react';
import {
  Activity, Wifi, WifiOff, AlertTriangle, Clock, RefreshCw, RefreshCcw,
  KeyRound, Zap, Pause, Play, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import type { ApiHealth, ReconnectStatus, ErrorReason } from '../../types';

const apiHealthConfig: Record<ApiHealth, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  VALID: { label: 'Valid', variant: 'success' },
  INVALID: { label: 'Invalid', variant: 'danger' },
  MISSING: { label: 'Missing', variant: 'warning' },
  RATE_LIMITED: { label: 'Rate Limited', variant: 'warning' },
  UNKNOWN: { label: 'Unknown', variant: 'neutral' },
};

const reconnectConfig: Record<ReconnectStatus, { label: string; variant: 'neutral' | 'success' | 'danger' | 'warning' | 'brand' }> = {
  IDLE: { label: 'Idle', variant: 'neutral' },
  PENDING: { label: 'Pending', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'brand' },
  SUCCEEDED: { label: 'Succeeded', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
}

function formatRelative(timestamp: number | null): string {
  if (!timestamp) return '—';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function ErrorBanner({ reason }: { reason: ErrorReason }) {
  return (
    <div className="mt-3 rounded-lg border border-bear-500/20 bg-bear-500/[0.04] px-3 py-2.5">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bear-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-bear-300">{reason.message}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{reason.suggestedAction}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">Error Code: {reason.code}</p>
        </div>
      </div>
    </div>
  );
}

export function ConnectionStatusCard() {
  const {
    mode,
    status,
    provider,
    apiHealth,
    reconnectStatus,
    autoRefreshEnabled,
    lastLiveUpdate,
    lastUpdated,
    errorReason,
    consecutiveFailures,
    maskedApiKey,
    apiKeySource,
    reconnect,
    testConnection,
    setAutoRefresh,
  } = useConnectionStatus();

  const [reconnecting, setReconnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isLive = mode === 'LIVE';
  const apiCfg = apiHealthConfig[apiHealth];
  const reconnectCfg = reconnectConfig[reconnectStatus];

  const handleReconnect = async () => {
    setReconnecting(true);
    await reconnect();
    setReconnecting(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection();
    setTestResult(result);
    setTesting(false);
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-brand-400" />
        <h3 className="text-sm font-semibold text-white">Market Connection Manager</h3>
        <Badge variant={isLive ? 'success' : 'warning'} dot>
          {isLive ? 'LIVE' : 'MOCK'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Connection Status */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {status === 'CONNECTED' ? <Wifi className="h-3.5 w-3.5 text-bull-400" /> : <WifiOff className="h-3.5 w-3.5 text-bear-400" />}
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Connection</p>
          </div>
          <p className={`mt-1 text-sm font-semibold ${status === 'CONNECTED' ? 'text-bull-400' : status === 'CONNECTING' ? 'text-gold-400' : 'text-bear-400'}`}>
            {status}
          </p>
        </div>

        {/* Data Provider */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Provider</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-200">{provider.label}</p>
        </div>

        {/* API Health */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">API Health</p>
          </div>
          <div className="mt-1">
            <Badge variant={apiCfg.variant} dot>{apiCfg.label}</Badge>
          </div>
        </div>

        {/* Auto Refresh */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {autoRefreshEnabled ? <Play className="h-3.5 w-3.5 text-bull-400" /> : <Pause className="h-3.5 w-3.5 text-gold-400" />}
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Auto Refresh</p>
          </div>
          <p className={`mt-1 text-sm font-semibold ${autoRefreshEnabled ? 'text-bull-400' : 'text-gold-400'}`}>
            {autoRefreshEnabled ? 'Active' : 'Paused'}
          </p>
        </div>

        {/* Last Live Update */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Live Update</p>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-300">{formatRelative(lastLiveUpdate)}</p>
        </div>

        {/* Reconnect Status */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Reconnect</p>
          </div>
          <div className="mt-1">
            <Badge variant={reconnectCfg.variant} dot>{reconnectCfg.label}</Badge>
          </div>
        </div>

        {/* Failures */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Failures</p>
          <p className={`mt-1 text-sm font-semibold ${consecutiveFailures > 0 ? 'text-gold-400' : 'text-slate-300'}`}>
            {consecutiveFailures}/3
          </p>
        </div>

        {/* Last Update */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Update</p>
          <p className="mt-1 text-sm font-medium text-slate-300">{formatTime(lastUpdated)}</p>
        </div>
      </div>

      {/* API Key info */}
      {maskedApiKey && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2">
          <KeyRound className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[11px] text-slate-500">Active Key:</span>
          <span className="text-xs font-mono text-slate-300">{maskedApiKey}</span>
          <Badge variant="neutral" className="ml-auto text-[10px]">{apiKeySource}</Badge>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${testResult.success ? 'border-bull-500/20 bg-bull-500/[0.04] text-bull-300' : 'border-bear-500/20 bg-bear-500/[0.04] text-bear-300'}`}>
          {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Error banner */}
      {errorReason && status !== 'CONNECTED' && <ErrorBanner reason={errorReason} />}

      {/* Manual controls */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handleReconnect}
          disabled={reconnecting}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          {reconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Reconnect
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Test Connection
        </button>
        <button
          onClick={() => setAutoRefresh(!autoRefreshEnabled)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {autoRefreshEnabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {autoRefreshEnabled ? 'Pause Refresh' : 'Resume Refresh'}
        </button>
      </div>
    </GlassCard>
  );
}
