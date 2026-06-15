'use client';
import { useEffect, useState } from 'react';
import { subscribeToNotifications, markNotificationRead, markAllRead } from '@/lib/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Notification } from '@/types';
import { clsx } from 'clsx';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, setNotifications);
  }, [user]);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black dark:text-white">Notifications</h1>
          {unread > 0 && <p className="text-sm text-gray-400 mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && user && (
          <Button size="sm" variant="ghost" onClick={() => markAllRead(user.uid)}>Mark all read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔔</div>
          <p className="font-bold dark:text-white">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <button key={n.id} onClick={() => user && !n.read && markNotificationRead(user.uid, n.id)}
              className={clsx('w-full text-left p-4 rounded-2xl border transition-colors',
                n.read
                  ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/10'
                  : 'bg-blue-50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold dark:text-white">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={n.type} variant={n.type === 'success' ? 'success' : n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : 'info'} />
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
