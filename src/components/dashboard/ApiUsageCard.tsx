// ApiUsageCard - API usage dashboard card.
// Shows: Provider, Plan, Polling Interval, API Status, Requests Sent,
// Estimated Requests Remaining, Last Successful Request, Last Failed Request,
// Quota State, Countdown Until Retry.
// Uses DHS glass UI. Responsive.

import {
  Gauge, Clock, CheckCircle2, XCircle, AlertTriangle, Timer,
  TrendingUp, Server, Activity, Hourglass,
} from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { planService } from '../../services/planService';
import type { TwelveDataPlan, ApiHealth, RateLimitState } from '../../types';

const planConfig: Record<TwelveDataPlan, { label: string; variant: 'neutral' | 'success' | 'warning' | 'brand' }> = {
  FREE: { label: 'Free', variant: 'neutral' },
  BASIC: { label: 'Basic', variant: 'success' },
  GROW: { label: 'Grow', variant: 'brand' },
  PRO: { label: 'Pro', variant: 'warning' },
};

const apiStatusConfig: Record<ApiHealth, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  VALID: { label: 'Valid', variant: 'success' },
  INVALID: { label: 'Invalid', variant: 'danger' },
  MISSING: { label: 'Missing', variant: 'warning' },
  RATE_LIMITED: { label: 'Rate Limited', variant: 'warning' },
  UNKNOWN: { label: 'Unknown', variant: 'neutral' },
};

const quotaStateConfig: Record<RateLimitState, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  OK: { label: 'OK', variant: 'success' },
  LIMITED: { label: 'Limited', variant: 'warning' },
  COOLDOWN: { label: 'Cooldown', variant: 'danger' },
};

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
}

function formatRelative(timestamp: number | null): string {
  if (!timestamp) return '-';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function ApiUsageCard() {
  const { apiUsage, pollingIntervalMs } = useConnectionStatus();

  const plan = apiUsage.plan;
  const planCfg = planConfig[plan];
  const apiCfg = apiStatusConfig[apiUsage.apiStatus];
  const quotaCfg = quotaStateConfig[apiUsage.quotaState];
  const intervalSeconds = (pollingIntervalMs / 1000).toFixed(0);
  const countdown = apiUsage.countdownUntilRetry;

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-brand-400" />
        <h3 className="text-sm font-semibold text-white">API Usage</h3>
        <Badge variant={apiCfg.variant} dot>{apiCfg.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Provider */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Provider</p>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-slate-200">{apiUsage.provider.label}</p>
        </div>

        {/* Plan */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Plan</p>
          </div>
          <div className="mt-1">
            <Badge variant={planCfg.variant} dot>{planCfg.label}</Badge>
          </div>
        </div>

        {/* Polling Interval */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Polling Interval</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-200">{intervalSeconds}s</p>
        </div>

        {/* API Status */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">API Status</p>
          </div>
          <div className="mt-1">
            <Badge variant={apiCfg.variant} dot>{apiCfg.label}</Badge>
          </div>
        </div>

        {/* Requests Sent */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Requests Sent</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{apiUsage.requestsSent}</p>
        </div>

        {/* Estimated Requests Remaining */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Est. Remaining</p>
          <p className={`mt-1 text-sm font-semibold ${apiUsage.estimatedRequestsRemaining !== null && apiUsage.estimatedRequestsRemaining < 50 ? 'text-gold-400' : 'text-slate-200'}`}>
            {apiUsage.estimatedRequestsRemaining ?? '-'}
          </p>
        </div>

        {/* Last Successful Request */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-bull-400" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Success</p>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-300">{formatRelative(apiUsage.lastSuccessfulRequest)}</p>
          <p className="text-[10px] text-slate-600">{formatTime(apiUsage.lastSuccessfulRequest)}</p>
        </div>

        {/* Last Failed Request */}
        <div className="rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-bear-400" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Failed</p>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-300">{formatRelative(apiUsage.lastFailedRequest)}</p>
          <p className="text-[10px] text-slate-600">{formatTime(apiUsage.lastFailedRequest)}</p>
        </div>
      </div>

      {/* Quota State and Countdown */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-800/40 px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Quota State:</span>
          <Badge variant={quotaCfg.variant} dot>{quotaCfg.label}</Badge>
        </div>

        {countdown !== null && countdown > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-bear-500/20 bg-bear-500/[0.04] px-3 py-2">
            <Hourglass className="h-3.5 w-3.5 text-bear-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Retry in:</span>
            <span className="text-sm font-bold text-bear-300 tabular">{countdown}s</span>
          </div>
        )}
      </div>

      {/* Rate limit message */}
      {apiUsage.quotaState === 'COOLDOWN' && (
        <div className="mt-3 rounded-lg border border-bear-500/20 bg-bear-500/[0.04] px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bear-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-bear-300">API quota reached. Waiting for provider reset.</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Polling is paused. Last successful live prices are still displayed (LIVE SNAPSHOT mode).
                Polling will automatically resume when the cooldown expires.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan selector */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Plan:</span>
        {(Object.keys(planConfig) as TwelveDataPlan[]).map((p) => (
          <button
            key={p}
            onClick={() => planService.setPlan(p)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              plan === p
                ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {planConfig[p].label}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
