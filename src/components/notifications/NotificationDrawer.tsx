// NotificationDrawer — slide-in panel showing all notifications

import { X, Bell, CheckCheck, Trash2 } from 'lucide-react';
import type { AppNotification, NotificationCategory } from '../../types/notification';
import { categoryConfig } from './notificationConfig';
import { NotificationCard } from './NotificationCard';

interface NotificationDrawerProps {
  open: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onMarkAllRead: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
}

const CATEGORY_ORDER: NotificationCategory[] = ['TRADE_SIGNAL', 'TRADE_UPDATE', 'MARKET_ALERT', 'SYSTEM'];

export function NotificationDrawer({
  open,
  notifications,
  unreadCount,
  onClose,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
  onRemove,
  onClearAll,
  onNotificationClick,
}: NotificationDrawerProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: notifications.filter((n) => n.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-sm flex-col border-l border-white/[0.06] bg-ink-900/95 backdrop-blur-xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-400" />
            <h2 className="text-sm font-bold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-ink-950">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action bar */}
        {notifications.length > 0 && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2">
            <button
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-bear-500/10 hover:text-bear-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>
        )}

        {/* List */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-3">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <Bell className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">No notifications</p>
                <p className="mt-0.5 text-[11px] text-slate-600">You're all caught up</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((group) => {
                const cfg = categoryConfig[group.category];
                return (
                  <div key={group.category}>
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                      {cfg.label}
                    </p>
                    <div className="space-y-1.5">
                      {group.items.map((n) => (
                        <NotificationCard
                          key={n.id}
                          notification={n}
                          onMarkRead={onMarkRead}
                          onMarkUnread={onMarkUnread}
                          onRemove={onRemove}
                          onClick={onNotificationClick}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
