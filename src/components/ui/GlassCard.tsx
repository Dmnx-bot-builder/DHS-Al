import { type ReactNode } from 'react';

export function GlassCard({ children, className = '', hover = true }: { children: ReactNode; className?: string; hover?: boolean; }) {
  return <div className={`glass shadow-glass-sm animate-fade-in ${hover ? 'transition-all duration-300 hover:border-white/10 hover:shadow-glass' : ''} ${className}`}>{children}</div>;
}

const badgeStyles: Record<string, string> = {
  neutral: 'bg-white/5 text-slate-300 border-white/10',
  success: 'bg-bull-500/10 text-bull-400 border-bull-500/30',
  danger: 'bg-bear-500/10 text-bear-400 border-bear-500/30',
  warning: 'bg-gold-500/10 text-gold-400 border-gold-500/30',
  brand: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
  gold: 'bg-gold-500/10 text-gold-400 border-gold-500/30',
};
const dotColors: Record<string, string> = { neutral: 'bg-slate-400', success: 'bg-bull-400', danger: 'bg-bear-400', warning: 'bg-gold-400', brand: 'bg-brand-400', gold: 'bg-gold-400' };

export function Badge({ children, variant = 'neutral', className = '', dot = false }: { children: ReactNode; variant?: 'neutral'|'success'|'danger'|'warning'|'brand'|'gold'; className?: string; dot?: boolean; }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${badgeStyles[variant]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
