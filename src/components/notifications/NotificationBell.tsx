// NotificationBell — bell icon button with unread badge

import { Bell } from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}`}
    >
      <Bell className="h-[18px] w-[18px]" />
      <NotificationBadge count={unreadCount} />
    </button>
  );
}
