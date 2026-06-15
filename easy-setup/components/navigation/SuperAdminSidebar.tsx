'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Palette, Mail, Users, FileText, ChevronLeft, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/authService';
import { Logo } from '@/components/ui/Logo';
import { clsx } from 'clsx';

const links = [
  { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/platform', label: 'Platform & Branding', icon: Palette },
  { href: '/superadmin/email', label: 'Email Settings', icon: Mail },
  { href: '/superadmin/admins', label: 'Admin Staff', icon: Users },
  { href: '/superadmin/audit', label: 'Audit Logs', icon: FileText },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-950 flex items-center justify-between px-4 z-40">
        <button onClick={() => setOpen(true)}><Menu className="w-5 h-5 text-white" /></button>
      </div>
      {open && <div className="lg:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setOpen(false)} />}
      <aside className={clsx(
        'fixed left-0 top-0 h-full w-64 bg-gray-950 flex flex-col z-50 transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <Logo size={36} />
          <div>
            <p className="font-black text-sm text-white">Super Admin</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Platform Control</p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden"><X className="w-4 h-4 text-white" /></button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname.startsWith(href) ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white')}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 mt-4">
            <ChevronLeft className="w-4 h-4" />Back to Admin
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Super Admin</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="text-gray-500 hover:text-red-400"><LogOut className="w-4 h-4" /></button>
        </div>
      </aside>
    </>
  );
}
