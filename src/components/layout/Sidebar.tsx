import { LayoutDashboard, CandlestickChart, Wallet, History, Brain, Newspaper, Settings, LifeBuoy, TrendingUp, LineChart, Zap, FlaskConical } from 'lucide-react';

const mainNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'strategy', label: 'Strategy Analysis', icon: LineChart },
  { id: 'execution', label: 'Trade Execution', icon: Zap },
  { id: 'charts', label: 'Charts', icon: CandlestickChart },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  { id: 'history', label: 'Trade History', icon: History },
  { id: 'backtesting', label: 'Backtesting', icon: FlaskConical },
  { id: 'ai', label: 'AI Engine', icon: Brain, badge: 'LIVE' },
  { id: 'news', label: 'Economic News', icon: Newspaper },
];
const utilNav = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

type NavItem = { id: string; label: string; icon: typeof LayoutDashboard; badge?: string; };

export function Sidebar({ active, onSelect, collapsed }: { active: string; onSelect: (id: string) => void; collapsed: boolean; }) {
  const renderItems = (items: NavItem[]) => items.map((item) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button key={item.id} onClick={() => onSelect(item.id)}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-brand-500/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'} ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? item.label : undefined}>
        {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />}
        <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-brand-300' : ''}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-bull-500/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-bull-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bull-400" />{item.badge}
          </span>
        )}
        {collapsed && item.badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-bull-400" />}
      </button>
    );
  });

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] bg-ink-900/80 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`flex h-16 items-center border-b border-white/[0.06] ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-glow-gold">
            <TrendingUp className="h-5 w-5 text-ink-950" />
          </div>
          {!collapsed && <div className="leading-tight"><p className="text-sm font-bold tracking-tight text-white">DHS AI</p><p className="text-[10px] tracking-wide text-slate-500">Hybrid Scalping</p></div>}
        </div>
      </div>
      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Trading</p>}
        {renderItems(mainNav)}
        {!collapsed && <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">System</p>}
        {renderItems(utilNav)}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-ink-800/60 p-3">
            <div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Risk Level</span><span className="text-[10px] font-semibold text-bull-400">LOW</span></div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5"><div className="h-full w-1/4 rounded-full bg-gradient-to-r from-bull-500 to-bull-400" /></div>
            <p className="mt-2 text-[10px] text-slate-600">2.5% per trade</p>
          </div>
        ) : <div className="flex justify-center"><div className="h-2 w-2 rounded-full bg-bull-400" /></div>}
      </div>
    </aside>
  );
}
