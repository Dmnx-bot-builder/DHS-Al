// Reusable error display with retry action

import { AlertCircle, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';
import type { ApiError } from '../../types';

export function ErrorDisplay({ error, onRetry, compact = false }: { error: ApiError | null; onRetry?: () => void; compact?: boolean }) {
  if (!error) return null;
  const message = getErrorMessage(error);

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-bear-500/20 bg-bear-500/[0.06] px-3 py-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-bear-400" />
        <span className="flex-1 text-xs text-bear-300">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="text-bear-400 transition-colors hover:text-bear-300">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-bear-500/15 bg-bear-500/[0.04] py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bear-500/15">
        <AlertCircle className="h-7 w-7 text-bear-400" />
      </div>
      <p className="mt-4 max-w-sm text-sm text-slate-300">{message}</p>
      {error.code && <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">Error: {error.code}</p>}
      {onRetry && (
        <button onClick={onRetry}
          className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10">
          <RefreshCw className="h-4 w-4" />Try Again
        </button>
      )}
    </div>
  );
}
