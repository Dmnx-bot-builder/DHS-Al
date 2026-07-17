// Reusable loading spinner with optional label

import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, label, className = '' }: { size?: number; label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 ${className}`}>
      <Loader2 className="animate-spin text-brand-400" style={{ width: size, height: size }} />
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  );
}

export function FullPageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center">
      <Spinner size={40} label={label} />
    </div>
  );
}

export function CardSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-ink-800/40">
      <Spinner size={28} label={label} />
    </div>
  );
}
