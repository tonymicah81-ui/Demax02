'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, User, Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/authService';
import { Logo } from '@/components/ui/Logo';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { clsx } from 'clsx';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/support', label: 'Support Chat', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/10 flex items-center justify-between px-4 z-40">
        <button onClick={() => setOpen(true)}><Menu className="w-5 h-5 dark:text-white" /></button>
        <div className="flex items-center gap-2"><NotificationBell /><ThemeToggle /></div>
      </div>
      {/* Overlay */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}
      {/* Sidebar */}
      <aside className={clsx(
        'fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-white/10 flex flex-col z-50 transition-transform duration-300',
        'lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-white/10">
          <Logo size={36} />
          <span className="font-black text-sm dark:text-white">My Platform</span>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden"><X className="w-4 h-4 dark:text-white" /></button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname === href ? 'bg-[var(--color-primary)] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10')}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold">
            {user?.profile && 'username' in user.profile ? user.profile.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold dark:text-white truncate">
              {user?.profile && 'username' in user.profile ? user.profile.username : 'User'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
        </div>
      </aside>
    </>
  );
}
