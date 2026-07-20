import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { DashboardPage } from './pages/DashboardPage';
import { StrategyPage } from './pages/StrategyPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { TradeHistoryPage } from './pages/TradeHistoryPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { SettingsPage } from './pages/SettingsPage';
import { useNotifications } from './hooks/useNotifications';
import { notificationService } from './services/notificationService';

function App() {
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markRead, markUnread, markAllRead, remove, clearAll } = useNotifications();

  useEffect(() => {
    const existing = notificationService.getAll();
    if (existing.length > 0) return;

    notificationService.add({
      category: 'SYSTEM',
      subtype: 'LIVE_CONNECTED',
      title: 'Live Market Connected',
      description: 'TwelveData provider active — receiving real-time XAU/USD market data.',
    });
    notificationService.add({
      category: 'TRADE_SIGNAL',
      subtype: 'BUY_SIGNAL',
      title: 'BUY Signal · XAU/USD',
      description: 'Confidence: 84% — Bullish market structure confirmed with BOS. Tap to view Trade Report.',
      meta: { symbol: 'XAU/USD', confidence: 84 },
    });
    notificationService.add({
      category: 'MARKET_ALERT',
      subtype: 'NEW_BOS',
      title: 'New BOS Detected',
      description: 'Break of Structure confirmed at 2384.70 on M15 — bullish order flow.',
    });
    notificationService.add({
      category: 'MARKET_ALERT',
      subtype: 'LIQUIDITY_SWEEP',
      title: 'Liquidity Sweep',
      description: 'Sell-side liquidity swept below 2371.40 before bullish reversal.',
    });
    notificationService.add({
      category: 'SYSTEM',
      subtype: 'BROKER_CONNECTED',
      title: 'Broker Connected',
      description: 'MT5 account linked — server: ICMarkets-Demo, latency 42ms.',
    });
  }, []);

  const renderPage = () => {
    switch (active) {
      case 'strategy': return <StrategyPage />;
      case 'execution': return <ExecutionPage />;
      case 'history': return <TradeHistoryPage />;
      case 'backtesting': return <BacktestingPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };
  return (
    <div className="relative min-h-screen bg-ink-950 text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-grid-faint bg-grid opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-radial-glow" />
      <Sidebar active={active} onSelect={setActive} collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className={`relative transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        <TopBar
          onToggleSidebar={() => setCollapsed(c => !c)}
          onToggleMobile={() => setMobileOpen(o => !o)}
          onToggleNotifications={() => setNotifOpen(o => !o)}
          notificationUnreadCount={unreadCount}
        />
        <main className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
          {renderPage()}
          <footer className="mt-8 flex flex-col items-center justify-between gap-2 py-4 text-[11px] text-slate-600 sm:flex-row sm:gap-0">
            <span>DHS AI — Damian Hybrid Scalping AI · For demonstration only</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-bull-400" />All systems operational</span>
          </footer>
        </main>
      </div>
      <NotificationDrawer
        open={notifOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setNotifOpen(false)}
        onMarkRead={markRead}
        onMarkUnread={markUnread}
        onMarkAllRead={markAllRead}
        onRemove={remove}
        onClearAll={clearAll}
      />
    </div>
  );
}
export default App;
