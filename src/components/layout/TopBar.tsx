import { Menu, Search, Power, Zap } from 'lucide-react';
import { watchlist } from '../../data/trading';
import { NotificationBell } from '../notifications/NotificationBell';

export function TopBar({ onToggleSidebar, onToggleMobile, onToggleNotifications, notificationUnreadCount }: { onToggleSidebar: () => void; onToggleMobile: () => void; onToggleNotifications: () => void; notificationUnreadCount: number; }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-ink-900/70 px-4 backdrop-blur-xl lg:px-6">
      <button onClick={onToggleMobile} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <button onClick={onToggleSidebar} className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:flex">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden items-center gap-2.5 md:flex">
        <div className="flex items-center gap-2 rounded-full border border-bull-500/30 bg-bull-500/10 px-3 py-1">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-bull-400" /><span className="relative inline-flex h-2 w-2 rounded-full bg-bull-400" /></span>
          <span className="text-[11px] font-semibold tracking-wide text-bull-400">AI ACTIVE</span>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-ticker gap-6">
          {[...watchlist, ...watchlist].map((item, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap text-xs">
              <span className="font-semibold text-slate-300">{item.symbol}</span>
              <span className="tabular text-slate-400">{item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className={item.changePct >= 0 ? 'text-bull-400' : 'text-bear-400'}>{item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink-900 to-transparent" />
      </div>
      <div className="flex items-center gap-1.5">
        <button className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:flex"><Search className="h-[18px] w-[18px]" /></button>
        <NotificationBell unreadCount={notificationUnreadCount} onClick={onToggleNotifications} />
        <div className="mx-1 h-6 w-px bg-white/10" />
        <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:from-brand-500 hover:to-brand-400"><Zap className="h-4 w-4" /><span className="hidden sm:inline">Quick Trade</span></button>
        <div className="ml-1 flex items-center gap-2.5 rounded-lg p-1 pr-2 transition-colors hover:bg-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">DM</div>
          <div className="hidden leading-tight lg:block"><p className="text-xs font-semibold text-white">Damian M.</p><p className="text-[10px] text-slate-500">Pro Account</p></div>
          <Power className="hidden h-4 w-4 text-slate-500 lg:block" />
        </div>
      </div>
    </header>
  );
}
