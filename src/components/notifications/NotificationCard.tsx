// NotificationCard - single notification row in the drawer
// Extended with priority badge display (CRITICAL/IMPORTANT/INFORMATIONAL)

import { Check, Trash2, Clock } from 'lucide-react';
import type { AppNotification } from '../../types/notification';
import { categoryConfig, subtypeConfig } from './notificationConfig';
import { priorityConfig, getSubtypePriority } from './priorityConfig';

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

interface NotificationCardProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onRemove: (id: string) => void;
  onClick?: (notification: AppNotification) => void;
}

export function NotificationCard({ notification, onMarkRead, onMarkUnread, onRemove, onClick }: NotificationCardProps) {
  const catCfg = categoryConfig[notification.category];
  const subCfg = subtypeConfig[notification.subtype];
  const Icon = subCfg.icon;
  const priority = notification.priority ?? getSubtypePriority(notification.subtype);
  const priCfg = priorityConfig[priority];

  return (
    <div
      className={`group animate-fade-in rounded-xl border p-3 transition-all duration-200 ${
        notification.read
          ? 'border-white/[0.04] bg-white/[0.02]'
          : priority === 'CRITICAL'
            ? 'border-bear-500/20 bg-bear-500/5'
            : priority === 'IMPORTANT'
              ? 'border-gold-500/15 bg-gold-500/5'
              : 'border-white/[0.08] bg-white/[0.04]'
      } hover:border-white/[0.12] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(notification)}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${subCfg.bgClass}`}>
          <Icon className={`h-4.5 w-4.5 ${subCfg.iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-slate-200">{notification.title}</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {priority !== 'INFORMATIONAL' && (
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${priCfg.accent} ring-1 ${priCfg.ring}`}>
                  <span className={`h-1 w-1 rounded-full ${priCfg.dot}`} />
                  {priCfg.label}
                </span>
              )}
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-gold-500" />
              )}
            </div>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{notification.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-500">
              {catCfg.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              <Clock className="h-2.5 w-2.5" />
              {formatTimestamp(notification.timestamp)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {notification.read ? (
          <button
            onClick={() => onMarkUnread(notification.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          >
            <Check className="h-3 w-3" />
            Mark unread
          </button>
        ) : (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          >
            <Check className="h-3 w-3" />
            Mark read
          </button>
        )}
        <button
          onClick={() => onRemove(notification.id)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 transition-colors hover:bg-bear-500/10 hover:text-bear-400"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
