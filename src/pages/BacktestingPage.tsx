import { useState, useMemo } from 'react';
import { FlaskConical, ChevronRight } from 'lucide-react';
import { BacktestConfigPanel } from '../components/backtesting/BacktestConfigPanel';
import { BacktestEquityCurve } from '../components/backtesting/BacktestEquityCurve';
import { BacktestDrawdownChart } from '../components/backtesting/BacktestDrawdownChart';
import { BacktestMonthlyReturns } from '../components/backtesting/BacktestMonthlyReturns';
import { BacktestTradeDistribution } from '../components/backtesting/BacktestTradeDistribution';
import { BacktestStatsCards } from '../components/backtesting/BacktestStatsCards';
import { BacktestReport } from '../components/backtesting/BacktestReport';
import {
  type BacktestConfig, type BacktestStatus,
  defaultConfig, generateBacktestTrades, computeBacktestStats,
  buildBacktestEquityCurve, buildDrawdownSeries,
  buildMonthlyReturns, buildTradeDistribution, buildBacktestReport,
} from '../data/backtesting';

export function BacktestingPage() {
  const [config, setConfig] = useState<BacktestConfig>(defaultConfig);
  const [status, setStatus] = useState<BacktestStatus>('IDLE');

  const result = useMemo(() => {
    if (status === 'IDLE') return null;
    const trades = generateBacktestTrades(config);
    const stats = computeBacktestStats(trades, config);
    const equityCurve = buildBacktestEquityCurve(trades, config.initialBalance);
    const drawdown = buildDrawdownSeries(trades, config.initialBalance);
    const monthly = buildMonthlyReturns(trades, config.initialBalance);
    const distribution = buildTradeDistribution(trades);
    const report = buildBacktestReport(trades, stats, config);
    return { trades, stats, equityCurve, drawdown, monthly, distribution, report };
  }, [config, status]);

  const handleRun = () => {
    setStatus('RUNNING');
    setTimeout(() => setStatus('COMPLETED'), 1200);
  };

  const isRunning = status === 'RUNNING';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span>Trading</span><ChevronRight className="h-3 w-3" /><span className="text-slate-300">Backtesting</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/20">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Backtesting</h1>
            <p className="text-xs text-slate-500">Test strategies on historical data with full performance analytics</p>
          </div>
        </div>
      </div>

      <BacktestConfigPanel config={config} onChange={setConfig} onRun={handleRun} isRunning={isRunning} />

      {status === 'IDLE' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ink-800/30 py-20 text-center">
          <FlaskConical className="h-12 w-12 text-slate-600" />
          <p className="mt-4 text-sm font-medium text-slate-400">Configure parameters and start a backtest</p>
          <p className="mt-1 text-xs text-slate-600">Results will appear here after running the backtest</p>
        </div>
      )}

      {isRunning && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-ink-800/30 py-20 text-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-500/20 border-t-brand-400" />
            <FlaskConical className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-brand-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-300">Running backtest...</p>
          <p className="mt-1 text-xs text-slate-500">Analyzing {config.symbol} on {config.timeframe} with {config.strategy}</p>
        </div>
      )}

      {status === 'COMPLETED' && result && (
        <div className="space-y-4 animate-fade-in">
          <BacktestStatsCards stats={result.stats} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BacktestEquityCurve equityCurve={result.equityCurve} initialBalance={config.initialBalance} />
            <BacktestDrawdownChart drawdown={result.drawdown} maxDrawdownPct={result.stats.maxDrawdownPct} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BacktestMonthlyReturns monthly={result.monthly} />
            <BacktestTradeDistribution distribution={result.distribution} />
          </div>

          <BacktestReport report={result.report} stats={result.stats} config={config} />
        </div>
      )}
    </div>
  );
}
