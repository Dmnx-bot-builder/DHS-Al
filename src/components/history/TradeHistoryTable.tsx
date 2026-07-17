import { useState, useMemo } from 'react';
import { Search, Filter, Download, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { type HistoryTrade, type HistorySide, type HistoryResult, STRATEGIES } from '../../data/history';

type SortField = 'ticket' | 'date' | 'side' | 'lotSize' | 'entryPrice' | 'exitPrice' | 'pnl' | 'rr' | 'durationMinutes' | 'strategy' | 'confidence' | 'result';
type SortDir = 'asc' | 'desc';

const PER_PAGE = 15;

export function TradeHistoryTable({ trades }: { trades: HistoryTrade[] }) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSide, setFilterSide] = useState<'ALL' | HistorySide>('ALL');
  const [filterResult, setFilterResult] = useState<'ALL' | HistoryResult>('ALL');
  const [filterStrategy, setFilterStrategy] = useState<'ALL' | string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterSide !== 'ALL') count++;
    if (filterResult !== 'ALL') count++;
    if (filterStrategy !== 'ALL') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [filterSide, filterResult, filterStrategy, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let result = [...trades];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.ticket.toLowerCase().includes(q) || t.strategy.toLowerCase().includes(q) || t.side.toLowerCase().includes(q));
    }
    if (filterSide !== 'ALL') result = result.filter((t) => t.side === filterSide);
    if (filterResult !== 'ALL') result = result.filter((t) => t.result === filterResult);
    if (filterStrategy !== 'ALL') result = result.filter((t) => t.strategy === filterStrategy);
    if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
    if (dateTo) result = result.filter((t) => t.date <= dateTo);

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return result;
  }, [trades, search, filterSide, filterResult, filterStrategy, dateFrom, dateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageData = filtered.slice(currentPage * PER_PAGE, (currentPage + 1) * PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterSide('ALL');
    setFilterResult('ALL');
    setFilterStrategy('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const exportCsv = () => {
    const headers = ['Ticket', 'Date', 'Side', 'Lots', 'Entry', 'Exit', 'SL', 'TP', 'P/L', 'R/R', 'Duration', 'Strategy', 'Confidence', 'Result'];
    const rows = filtered.map((t) => [t.ticket, t.date, t.side, t.lotSize, t.entryPrice, t.exitPrice, t.stopLoss, t.takeProfit, t.netPnl, t.rr, t.duration, t.strategy, t.confidence, t.result]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-600" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-brand-400" /> : <ChevronDown className="h-3 w-3 text-brand-400" />;
  };

  const selectClass = "rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-brand-500/40";
  const inputClass = "rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-brand-500/40";

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Trade History</h3>
          <span className="text-[10px] text-slate-500">{filtered.length} of {trades.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search…"
              className={`${inputClass} pl-8 w-40`} />
          </div>
          <button onClick={() => setShowFilters((s) => !s)}
            className="relative flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10">
            <Filter className="h-3.5 w-3.5" />Filters
            {activeFilterCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">{activeFilterCount}</span>}
          </button>
          <button onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10">
            <Download className="h-3.5 w-3.5" />CSV
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="border-b border-white/[0.06] bg-white/[0.02] p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">Side</label>
              <select value={filterSide} onChange={(e) => { setFilterSide(e.target.value as 'ALL' | HistorySide); setPage(0); }} className={selectClass}>
                <option value="ALL">All</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">Result</label>
              <select value={filterResult} onChange={(e) => { setFilterResult(e.target.value as 'ALL' | HistoryResult); setPage(0); }} className={selectClass}>
                <option value="ALL">All</option>
                <option value="WIN">Win</option>
                <option value="LOSS">Loss</option>
                <option value="BREAKEVEN">Breakeven</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">Strategy</label>
              <select value={filterStrategy} onChange={(e) => { setFilterStrategy(e.target.value); setPage(0); }} className={selectClass}>
                <option value="ALL">All</option>
                {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className={inputClass} />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-3 flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-bear-400">
              <X className="h-3 w-3" />Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
              {([
                { field: 'ticket' as SortField, label: 'Ticket', align: 'left' },
                { field: 'date' as SortField, label: 'Date', align: 'left' },
                { field: 'side' as SortField, label: 'Side', align: 'left' },
                { field: 'lotSize' as SortField, label: 'Lots', align: 'right' },
                { field: 'entryPrice' as SortField, label: 'Entry', align: 'right' },
                { field: 'exitPrice' as SortField, label: 'Exit', align: 'right' },
                { field: 'pnl' as SortField, label: 'P/L', align: 'right' },
                { field: 'rr' as SortField, label: 'R/R', align: 'right' },
                { field: 'durationMinutes' as SortField, label: 'Duration', align: 'left' },
                { field: 'strategy' as SortField, label: 'Strategy', align: 'left' },
                { field: 'confidence' as SortField, label: 'Conf', align: 'right' },
                { field: 'result' as SortField, label: 'Result', align: 'left' },
              ]).map((col) => (
                <th key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`cursor-pointer select-none px-3 py-2.5 font-medium transition-colors hover:text-slate-300 ${col.align === 'right' ? 'text-right' : ''}`}>
                  <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                    {col.label}<SortIcon field={col.field} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((t) => {
              const isBuy = t.side === 'BUY';
              const pnlPositive = t.netPnl > 0;
              const pnlNegative = t.netPnl < 0;
              return (
                <tr key={t.id} className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]">
                  <td className="tabular px-3 py-2 font-medium text-slate-300">{t.ticket}</td>
                  <td className="tabular px-3 py-2 text-slate-400">{t.date}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isBuy ? 'bg-bull-500/15 text-bull-400' : 'bg-bear-500/15 text-bear-400'}`}>{t.side}</span>
                  </td>
                  <td className="tabular px-3 py-2 text-right text-slate-300">{t.lotSize.toFixed(2)}</td>
                  <td className="tabular px-3 py-2 text-right text-slate-300">{t.entryPrice.toFixed(2)}</td>
                  <td className="tabular px-3 py-2 text-right text-slate-400">{t.exitPrice.toFixed(2)}</td>
                  <td className={`tabular px-3 py-2 text-right font-semibold ${pnlPositive ? 'text-bull-400' : pnlNegative ? 'text-bear-400' : 'text-slate-400'}`}>
                    {pnlPositive ? '+' : ''}{t.netPnl.toFixed(2)}
                  </td>
                  <td className="tabular px-3 py-2 text-right text-gold-400">{t.rr.toFixed(1)}</td>
                  <td className="tabular px-3 py-2 text-slate-400">{t.duration}</td>
                  <td className="px-3 py-2 text-slate-400">{t.strategy}</td>
                  <td className="tabular px-3 py-2 text-right text-slate-300">{t.confidence}%</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.result === 'WIN' ? 'bg-bull-500/15 text-bull-400' : t.result === 'LOSS' ? 'bg-bear-500/15 text-bear-400' : 'bg-gold-500/15 text-gold-400'}`}>
                      {t.result}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex h-24 items-center justify-center text-xs text-slate-600">No trades match your filters</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.06] p-3">
          <span className="text-[10px] text-slate-500">
            Page {currentPage + 1} of {totalPages} · {filtered.length} trades
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="tabular px-2 text-xs text-slate-400">{currentPage + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
