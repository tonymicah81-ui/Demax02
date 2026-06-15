'use client';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToNotifications, markNotificationRead, markAllRead } from '@/lib/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types';
import { clsx } from 'clsx';

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, setNotifications);
  }, [user]);

  const unread = notifications.filter(n => !n.read).length;

  async function handleClick(n: Notification) {
    if (!user || n.read) return;
    await markNotificationRead(user.uid, n.id);
    if (n.link) window.location.href = n.link;
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 z-40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
                <span className="text-sm font-bold dark:text-white">Notifications</span>
                {unread > 0 && user && (
                  <button onClick={() => markAllRead(user.uid)} className="text-xs text-[var(--color-primary)] hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
                ) : notifications.map(n => (
                  <button key={n.id} onClick={() => handleClick(n)}
                    className={clsx('w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors', !n.read && 'bg-blue-50/50 dark:bg-blue-500/5')}>
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                      <div className={!n.read ? '' : 'pl-4'}>
                        <p className="text-sm font-semibold dark:text-white">{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
