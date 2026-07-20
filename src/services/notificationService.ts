// DHS AI Notification Service
// Singleton service with localStorage persistence, subscription pattern,
// and deduplication. Matches the existing marketDataService architecture.

import type { AppNotification, NotificationInput } from '../types/notification';

type Listener = (notifications: AppNotification[]) => void;

const STORAGE_KEY = 'dhs-ai-notifications';
const MAX_NOTIFICATIONS = 100;
const DEDUP_WINDOW_MS = 5_000;

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => n && typeof n.id === 'string' && typeof n.timestamp === 'number');
  } catch {
    return [];
  }
}

function saveToStorage(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // Storage full or unavailable — silently drop
  }
}

function generateId(): string {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

class NotificationService {
  private notifications: AppNotification[];
  private listeners = new Set<Listener>();

  constructor() {
    this.notifications = loadFromStorage();
  }

  getAll(): AppNotification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
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

  private isDuplicate(input: NotificationInput): boolean {
    const now = Date.now();
    return this.notifications.some(
      (n) =>
        n.subtype === input.subtype &&
        n.title === input.title &&
        n.description === input.description &&
        now - n.timestamp < DEDUP_WINDOW_MS,
    );
  }

  add(input: NotificationInput): AppNotification | null {
    if (this.isDuplicate(input)) return null;

    const notification: AppNotification = {
      id: generateId(),
      category: input.category,
      subtype: input.subtype,
      title: input.title,
      description: input.description,
      timestamp: Date.now(),
      read: false,
      meta: input.meta,
    };

    this.notifications = [notification, ...this.notifications].slice(0, MAX_NOTIFICATIONS);
    saveToStorage(this.notifications);
    this.notify();
    return notification;
  }

  markRead(id: string): void {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    saveToStorage(this.notifications);
    this.notify();
  }

  markUnread(id: string): void {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: false } : n,
    );
    saveToStorage(this.notifications);
    this.notify();
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    saveToStorage(this.notifications);
    this.notify();
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    saveToStorage(this.notifications);
    this.notify();
  }

  clearAll(): void {
    this.notifications = [];
    saveToStorage(this.notifications);
    this.notify();
  }
}

export const notificationService = new NotificationService();
