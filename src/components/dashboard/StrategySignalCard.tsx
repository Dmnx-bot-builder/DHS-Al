// StrategySignalCard — Dashboard card showing live strategy event state
// Extended with signal lifecycle stage, quality score, validation status,
// time since confirmation, next validation, and trade outcome.

import { Activity, TrendingUp, TrendingDown, Ban, Clock, Bell, Hash, Shield, Gauge, CheckCircle2, Timer, Target, XCircle } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassCard';
import { useStrategyEvents } from '../../hooks/useStrategyEvents';
import { useSignalId } from '../../hooks/useSignalId';
import { useSignalLifecycle } from '../../hooks/useSignalLifecycle';
import { useSignalValidation } from '../../hooks/useSignalValidation';
import type { AiDecision } from '../../data/strategy';
import type { SignalLifecycleStage, QualityLevel } from '../../types/signalLifecycle';
import { QUALITY_LEVEL_LABELS } from '../../services/signalQualityCalculator';

const decisionConfig: Record<AiDecision, { text: string; bg: string; icon: typeof TrendingUp; label: string }> = {
  BUY: { text: 'text-bull-400', bg: 'bg-bull-500/10', icon: TrendingUp, label: 'BUY' },
  SELL: { text: 'text-bear-400', bg: 'bg-bear-500/10', icon: TrendingDown, label: 'SELL' },
  NO_TRADE: { text: 'text-slate-400', bg: 'bg-white/5', icon: Ban, label: 'NO TRADE' },
};

const stageConfig: Record<SignalLifecycleStage, { label: string; color: string; bg: string }> = {
  DETECTED: { label: 'Detected', color: 'text-slate-300', bg: 'bg-white/5' },
  VALIDATING: { label: 'Validating', color: 'text-gold-400', bg: 'bg-gold-500/10' },
  CONFIRMED: { label: 'Confirmed', color: 'text-brand-300', bg: 'bg-brand-500/10' },
  ACTIVE: { label: 'Active', color: 'text-bull-400', bg: 'bg-bull-500/10' },
  MONITORING: { label: 'Monitoring', color: 'text-brand-300', bg: 'bg-brand-500/10' },
  TAKE_PROFIT_HIT: { label: 'TP Hit', color: 'text-bull-400', bg: 'bg-bull-500/10' },
  STOP_LOSS_HIT: { label: 'SL Hit', color: 'text-bear-400', bg: 'bg-bear-500/10' },
  INVALIDATED: { label: 'Invalidated', color: 'text-bear-400', bg: 'bg-bear-500/10' },
  ARCHIVED: { label: 'Archived', color: 'text-slate-500', bg: 'bg-white/5' },
};

const qualityColor: Record<QualityLevel, string> = {
  ELITE_SETUP: 'text-bull-400',
  PREMIUM_SETUP: 'text-brand-300',
  HIGH_QUALITY: 'text-brand-300',
  TRADABLE: 'text-gold-400',
  IGNORE: 'text-slate-500',
};

const qualityBadge: Record<QualityLevel, 'success' | 'brand' | 'gold' | 'neutral'> = {
  ELITE_SETUP: 'success',
  PREMIUM_SETUP: 'brand',
  HIGH_QUALITY: 'brand',
  TRADABLE: 'gold',
  IGNORE: 'neutral',
};

function formatTime(ts: number | null): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString();
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

export function StrategySignalCard() {
  const events = useStrategyEvents();
  const signalId = useSignalId();
  const lifecycle = useSignalLifecycle();
  const validation = useSignalValidation();

  const decision = events.lastDecision;
  const cfg = decision ? decisionConfig[decision] : null;
  const DecisionIcon = cfg?.icon ?? Activity;

  const activeSignal = lifecycle.active;
  const stage = activeSignal?.stage;
  const stageCfg = stage ? stageConfig[stage] : null;
  const qualityLevel = activeSignal?.qualityLevel;
  const qualityScore = activeSignal?.qualityScore ?? events.lastQualityScore;
  const pendingValidation = validation.pending;
  const nextValidationMs = pendingValidation?.nextValidationAt ?? validation.lastResult?.nextValidationAt;
  const timeUntilValidation = nextValidationMs ? Math.max(0, nextValidationMs - Date.now()) : null;

  return (
    <GlassCard hover={false} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Strategy Signal</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {stage && stageCfg && (
            <Badge variant={stage === 'ACTIVE' || stage === 'MONITORING' ? 'success' : stage === 'VALIDATING' ? 'gold' : stage === 'INVALIDATED' || stage === 'STOP_LOSS_HIT' ? 'danger' : 'neutral'} dot>
              {stageCfg.label}
            </Badge>
          )}
          {decision && cfg && (
            <Badge variant={decision === 'BUY' ? 'success' : decision === 'SELL' ? 'danger' : 'neutral'} dot>
              {cfg.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Current signal */}
      <div className={`mt-3 flex items-center gap-3 rounded-xl border border-white/[0.06] ${cfg?.bg ?? 'bg-white/[0.02]'} px-3 py-2.5`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg?.bg ?? 'bg-white/5'} ${cfg?.text ?? 'text-slate-400'}`}>
          <DecisionIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Latest Signal</p>
          <p className={`text-sm font-bold ${cfg?.text ?? 'text-slate-400'}`}>
            {decision ? cfg!.label : 'Waiting for data...'}
          </p>
        </div>
        {signalId && (
          <div className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1">
            <Hash className="h-3 w-3 text-brand-300" />
            <span className="truncate text-[9px] font-mono text-slate-400">{signalId.signalId}</span>
          </div>
        )}
      </div>

      {/* Quality Score & Lifecycle Stage */}
      {qualityLevel && qualityScore !== null && qualityScore !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2">
            <Gauge className={`h-4 w-4 ${qualityColor[qualityLevel]}`} />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">Quality Score</p>
              <p className={`text-xs font-bold ${qualityColor[qualityLevel]}`}>
                {qualityScore} <span className="text-[10px] font-medium">/ 100</span>
              </p>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <Badge variant={qualityBadge[qualityLevel]}>
              {QUALITY_LEVEL_LABELS[qualityLevel]}
            </Badge>
          </div>
        </div>
      )}

      {/* Validation status */}
      {pendingValidation && !events.signalConfirmed && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-2.5 py-2">
          <Shield className="h-4 w-4 text-gold-400" />
          <div className="flex-1">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Validation</p>
            <p className="text-xs font-semibold text-gold-400">
              Cycle {validation.lastResult?.validationCycle ?? 0}/{validation.config.validationCyclesRequired}
              {validation.lastResult && validation.lastResult.reasons.length > 0 && (
                <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                  · {validation.lastResult.reasons[0]}
                </span>
              )}
            </p>
          </div>
          {timeUntilValidation !== null && timeUntilValidation > 0 && (
            <div className="flex items-center gap-1 text-gold-400">
              <Timer className="h-3 w-3" />
              <span className="text-[10px] font-mono">{formatDuration(timeUntilValidation)}</span>
            </div>
          )}
        </div>
      )}

      {/* Confirmed signal details */}
      {events.signalConfirmed && activeSignal && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-bull-500/20 bg-bull-500/5 px-2.5 py-2">
          <CheckCircle2 className="h-4 w-4 text-bull-400" />
          <div className="flex-1">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Confirmed</p>
            <p className="text-xs font-semibold text-bull-400">
              {formatTime(activeSignal.confirmedAt)}
              {activeSignal.confirmedAt && activeSignal.createdAt && (
                <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                  · {formatDuration(activeSignal.confirmedAt - activeSignal.createdAt)} to confirm
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Trade outcome */}
      {activeSignal?.outcome && activeSignal.outcome !== 'PENDING' && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2">
          {activeSignal.outcome === 'PROFIT' ? (
            <Target className="h-4 w-4 text-bull-400" />
          ) : activeSignal.outcome === 'LOSS' ? (
            <XCircle className="h-4 w-4 text-bear-400" />
          ) : (
            <Ban className="h-4 w-4 text-slate-400" />
          )}
          <div className="flex-1">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Trade Outcome</p>
            <p className={`text-xs font-semibold ${
              activeSignal.outcome === 'PROFIT' ? 'text-bull-400' :
              activeSignal.outcome === 'LOSS' ? 'text-bear-400' :
              'text-slate-400'
            }`}>
              {activeSignal.outcome}
              {activeSignal.closureReason && (
                <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                  · {activeSignal.closureReason.replace(/_/g, ' ')}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-bull-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Last BUY</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">{formatTime(events.lastBuyAt)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-bear-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Last SELL</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">{formatTime(events.lastSellAt)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-brand-300" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Strategy Update</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">{formatTime(events.lastStrategyUpdate)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1">
            <Bell className="h-3 w-3 text-gold-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Last Notification</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-200">
            {events.lastNotificationSubtype ? events.lastNotificationSubtype.replace(/_/g, ' ') : '—'}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
