import { type ReactNode } from 'react';

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${checked ? 'bg-brand-500' : 'bg-white/10'} ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function SettingsSection({ icon, title, description, children, accent = 'brand' }: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  accent?: 'brand' | 'gold' | 'bull' | 'bear';
}) {
  const accentMap: Record<string, string> = {
    brand: 'bg-brand-500/15 text-brand-300',
    gold: 'bg-gold-500/15 text-gold-400',
    bull: 'bg-bull-500/15 text-bull-400',
    bear: 'bg-bear-500/15 text-bear-400',
  };
  return (
    <div className="glass shadow-glass-sm animate-fade-in overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentMap[accent]}`}>{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-white/10 bg-ink-800/60 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-brand-500/50 focus:bg-ink-800/80';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

export function SaveBar({ onSave, saved, dirty }: { onSave: () => void; saved: boolean; dirty: boolean }) {
  return (
    <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-xl border border-white/10 bg-ink-800/90 px-5 py-3 shadow-glass backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs">
        {saved ? (
          <span className="flex items-center gap-1.5 text-bull-400">
            <span className="h-2 w-2 rounded-full bg-bull-400" />Settings saved successfully
          </span>
        ) : dirty ? (
          <span className="flex items-center gap-1.5 text-gold-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />Unsaved changes
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-600" />All changes saved
          </span>
        )}
      </div>
      <button
        onClick={onSave}
        disabled={!dirty && !saved}
        className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
