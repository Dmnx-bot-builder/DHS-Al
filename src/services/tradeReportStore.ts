// TradeReportStore — stores generated trade reports by reportId in localStorage.
// Allows notifications to reference a specific report and open it on click.

import type { TradeReport } from '../types/tradeReport';

const STORAGE_KEY = 'dhs-ai-trade-reports';
const MAX_REPORTS = 100;

type Listener = (reports: Record<string, TradeReport>) => void;

function loadFromStorage(): Record<string, TradeReport> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TradeReport>;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveToStorage(reports: Record<string, TradeReport>): void {
  try {
    const keys = Object.keys(reports);
    if (keys.length > MAX_REPORTS) {
      const trimmed: Record<string, TradeReport> = {};
      keys.slice(0, MAX_REPORTS).forEach((k) => { trimmed[k] = reports[k]; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    }
  } catch {
    // ignore
  }
}

function generateReportId(): string {
  return `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class TradeReportStore {
  private reports: Record<string, TradeReport>;
  private listeners = new Set<Listener>();

  constructor() {
    this.reports = loadFromStorage();
  }

  getAll(): Record<string, TradeReport> {
    return { ...this.reports };
  }

  getById(reportId: string): TradeReport | undefined {
    return this.reports[reportId];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getAll());
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const snapshot = this.getAll();
    this.listeners.forEach((l) => l(snapshot));
  }

  /**
   * Stores a trade report and returns the generated reportId.
   */
  store(report: TradeReport): string {
    const reportId = generateReportId();
    this.reports = { [reportId]: report, ...this.reports };
    // Keep only the most recent MAX_REPORTS
    const keys = Object.keys(this.reports);
    if (keys.length > MAX_REPORTS) {
      const trimmed: Record<string, TradeReport> = {};
      keys.slice(0, MAX_REPORTS).forEach((k) => { trimmed[k] = this.reports[k]; });
      this.reports = trimmed;
    }
    saveToStorage(this.reports);
    this.notify();
    return reportId;
  }

  remove(reportId: string): void {
    delete this.reports[reportId];
    saveToStorage(this.reports);
    this.notify();
  }
}

export const tradeReportStore = new TradeReportStore();
