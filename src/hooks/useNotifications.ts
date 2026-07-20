// useNotifications — React hook wrapping notificationService with subscription

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import type { AppNotification, NotificationInput } from '../types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((next) => {
      setNotifications(next);
    });
    return unsubscribe;
  }, []);

  const add = useCallback((input: NotificationInput) => {
    notificationService.add(input);
  }, []);

  const markRead = useCallback((id: string) => {
    notificationService.markRead(id);
  }, []);

  const markUnread = useCallback((id: string) => {
    notificationService.markUnread(id);
  }, []);

  const markAllRead = useCallback(() => {
    notificationService.markAllRead();
  }, []);

  const remove = useCallback((id: string) => {
    notificationService.remove(id);
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    add,
    markRead,
    markUnread,
    markAllRead,
    remove,
    clearAll,
  };
}
