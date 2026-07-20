// SignalIdService — generates and persists globally unique Signal IDs.
// Format: BUY-XAUUSD-YYYYMMDD-HHMMSS, SELL-XAUUSD-YYYYMMDD-HHMMSS, NOTRADE-XAUUSD-YYYYMMDD-HHMMSS
// Signal IDs persist across page refreshes until the signal is closed or invalidated.

import type { AiDecision } from '../data/strategy';

const STORAGE_KEY = 'dhs-ai-active-signal-id';
const HISTORY_KEY = 'dhs-ai-signal-id-history';
const MAX_HISTORY = 200;

export interface SignalIdEntry {
  signalId: string;
  decision: AiDecision;
  symbol: string;
  createdAt: number;
  confidence: number;
  invalidated: boolean;
  invalidatedAt: number | null;
}

type Listener = (entry: SignalIdEntry | null) => void;

function normalizeSymbol(symbol: string): string {
  return symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function formatTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${h}${mi}${s}`;
}

function generateSignalId(decision: AiDecision, symbol: string): string {
  const prefix = decision === 'NO_TRADE' ? 'NOTRADE' : decision;
  const sym = normalizeSymbol(symbol);
  const ts = formatTimestamp();
  return `${prefix}-${sym}-${ts}`;
}

function loadActiveFromStorage(): SignalIdEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SignalIdEntry;
    if (parsed && typeof parsed.signalId === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveActiveToStorage(entry: SignalIdEntry | null): void {
  try {
    if (entry) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function loadHistoryFromStorage(): SignalIdEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SignalIdEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.signalId === 'string');
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history: SignalIdEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // ignore
  }
}

class SignalIdService {
  private activeEntry: SignalIdEntry | null;
  private history: SignalIdEntry[];
  private listeners = new Set<Listener>();

  constructor() {
    this.activeEntry = loadActiveFromStorage();
    this.history = loadHistoryFromStorage();
  }

  /**
   * Returns the currently active Signal ID entry, or null if none exists.
   */
  getActiveSignalId(): SignalIdEntry | null {
    return this.activeEntry;
  }

  /**
   * Returns the raw signal ID string, or null.
   */
  getActiveSignalIdString(): string | null {
    return this.activeEntry?.signalId ?? null;
  }

  /**
   * Returns the full history of signal IDs.
   */
  getHistory(): SignalIdEntry[] {
    return [...this.history];
  }

  /**
   * Looks up a signal ID entry by its ID string.
   */
  getById(signalId: string): SignalIdEntry | undefined {
    if (this.activeEntry?.signalId === signalId) return this.activeEntry;
    return this.history.find((e) => e.signalId === signalId);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.activeEntry);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.activeEntry));
  }

  /**
   * Ensures an active Signal ID exists for the given decision.
   * If the decision has changed (e.g., BUY -> SELL), generates a new ID.
   * If only confidence/explanation changed but direction is the same, keeps the existing ID.
   * Returns the active Signal ID entry.
   */
  ensureSignalId(decision: AiDecision, symbol: string, confidence: number): SignalIdEntry {
    const normalizedSymbol = symbol;

    if (this.activeEntry && this.activeEntry.decision === decision && !this.activeEntry.invalidated) {
      // Same direction, not invalidated — update confidence but keep the ID
      this.activeEntry = {
        ...this.activeEntry,
        confidence,
      };
      saveActiveToStorage(this.activeEntry);
      this.notify();
      return this.activeEntry;
    }

    // Direction changed, no active entry, or invalidated — generate new ID
    // Move old entry to history first
    if (this.activeEntry) {
      this.history = [this.activeEntry, ...this.history].slice(0, MAX_HISTORY);
      saveHistoryToStorage(this.history);
    }

    const newEntry: SignalIdEntry = {
      signalId: generateSignalId(decision, normalizedSymbol),
      decision,
      symbol: normalizedSymbol,
      createdAt: Date.now(),
      confidence,
      invalidated: false,
      invalidatedAt: null,
    };

    this.activeEntry = newEntry;
    saveActiveToStorage(newEntry);
    this.history = [newEntry, ...this.history].slice(0, MAX_HISTORY);
    saveHistoryToStorage(this.history);
    this.notify();
    return newEntry;
  }

  /**
   * Invalidates the current active signal ID (e.g., when market structure changes).
   * Moves it to history as invalidated.
   */
  invalidateActive(): void {
    if (!this.activeEntry) return;
    const invalidated: SignalIdEntry = {
      ...this.activeEntry,
      invalidated: true,
      invalidatedAt: Date.now(),
    };
    this.history = [invalidated, ...this.history.filter((e) => e.signalId !== invalidated.signalId)].slice(0, MAX_HISTORY);
    saveHistoryToStorage(this.history);
    this.activeEntry = null;
    saveActiveToStorage(null);
    this.notify();
  }

  /**
   * Clears the active signal ID without invalidating (e.g., on NO_TRADE).
   */
  clearActive(): void {
    this.activeEntry = null;
    saveActiveToStorage(null);
    this.notify();
  }
}

export const signalIdService = new SignalIdService();
