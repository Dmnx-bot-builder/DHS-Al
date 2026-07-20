import { LayoutDashboard } from 'lucide-react';
import { StatGrid } from '../components/dashboard/StatGrid';
import { TradingChart } from '../components/dashboard/TradingChart';
import { PerformanceGraph } from '../components/dashboard/PerformanceGraph';
import { RecentTrades } from '../components/dashboard/RecentTrades';
import { MarketStatus } from '../components/dashboard/MarketStatus';
import { AiStatus } from '../components/dashboard/AiStatus';
import { EconomicNews } from '../components/dashboard/EconomicNews';
import { MarketDataStatusBar } from '../components/dashboard/MarketDataStatusBar';
import { ConnectionStatusCard } from '../components/dashboard/ConnectionStatusCard';
import { useMarketData } from '../hooks/useMarketData';

export function DashboardPage() {
  const marketData = useMarketData('XAU/USD', 'M15');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time account overview and market intelligence</p>
        </div>
      </div>

      <MarketDataStatusBar state={marketData} />

      <ConnectionStatusCard />

      <StatGrid />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <TradingChart />
          <PerformanceGraph />
          <RecentTrades />
        </div>
        <div className="space-y-4">
          <MarketStatus />
          <AiStatus />
          <EconomicNews />
        </div>
      </div>
    </div>
  );
}
