import { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { HistorySummaryCards } from '../components/history/HistorySummaryCards';
import { EquityCurveChart, MonthlyPnlChart } from '../components/history/HistoryCharts';
import { WinLossDonut, StrategyBreakdown } from '../components/history/HistoryStrategyCharts';
import { ConfidencePnlChart, PipsDistributionChart } from '../components/history/HistoryScatterCharts';
import { TradeHistoryTable } from '../components/history/TradeHistoryTable';
import { historyTrades, type HistoryTrade } from '../data/history';

type DateRange = 'all' | '30' | '14' | '7';

const rangeLabels: Record<DateRange, string> = { all: 'All time', '30': '30 days', '14': '14 days', '7': '7 days' };

export function TradeHistoryPage() {
  const [range, setRange] = useState<DateRange>('all');

  const filteredTrades: HistoryTrade[] = useMemo(() => {
    if (range === 'all') return historyTrades;
    // All trades are in July 2024; simulate filtering by counting back from the latest date
    const sorted = [...historyTrades].sort((a, b) => b.date.localeCompare(a.date) || b.closeTime.localeCompare(a.closeTime));
    const days = parseInt(range, 10);
    const cutoffDate = sorted[0].date;
    const cutoff = new Date(cutoffDate);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().substring(0, 10);
    return sorted.filter((t) => t.date >= cutoffStr);
  }, [range]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Trade History</h1>
            <p className="text-xs text-slate-500">Performance analytics and closed trade records</p>
          </div>
        </div>
        <div className="flex overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-0.5 no-scrollbar">
          {(['all', '30', '14', '7'] as DateRange[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${range === r ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <HistorySummaryCards trades={filteredTrades} />

      {/* Equity + Monthly row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EquityCurveChart trades={filteredTrades} />
        <MonthlyPnlChart trades={filteredTrades} />
      </div>

      {/* 4-col analytics grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WinLossDonut trades={filteredTrades} />
        <StrategyBreakdown trades={filteredTrades} />
        <ConfidencePnlChart trades={filteredTrades} />
        <PipsDistributionChart trades={filteredTrades} />
      </div>

      {/* Table */}
      <TradeHistoryTable trades={filteredTrades} />
    </div>
  );
}
