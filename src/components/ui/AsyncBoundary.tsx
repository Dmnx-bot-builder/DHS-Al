// AsyncBoundary — wraps async content with loading/error/empty states

import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Spinner } from './Spinner';
import { ErrorDisplay } from './ErrorDisplay';
import type { ApiError } from '../../types';

interface Props {
  loading: boolean;
  error: ApiError | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
  loadingLabel?: string;
  minHeight?: string;
}

export function AsyncBoundary({
  loading, error, onRetry, empty, emptyLabel = 'No data available',
  children, loadingLabel, minHeight = 'auto',
}: Props) {
  if (loading) {
    return <div style={{ minHeight: minHeight === 'auto' ? undefined : minHeight }} className="flex items-center justify-center py-12"><Spinner size={32} label={loadingLabel} /></div>;
  }
  if (error) {
    return <ErrorDisplay error={error} onRetry={onRetry} />;
  }
  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-ink-800/30 py-12 text-center">
        <Inbox className="h-10 w-10 text-slate-600" />
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      </div>
    );
  }
  return <>{children}</>;
}
