'use client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Bell, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
  const { user } = useAuth();
  const username = user?.profile && 'username' in user.profile ? user.profile.username : 'there';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black dark:text-white">Hello, {username} 👋</h1>
        <p className="text-gray-400 mt-1 text-sm">Welcome to your dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/support', icon: MessageSquare, label: 'Support Chat', desc: 'Chat with our team', color: 'bg-blue-500' },
          { href: '/notifications', icon: Bell, label: 'Notifications', desc: 'View your alerts', color: 'bg-purple-500' },
          { href: '/profile', icon: User, label: 'My Profile', desc: 'Update your details', color: 'bg-green-500' },
        ].map(card => (
          <Link key={card.href} href={card.href}
            className="group p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-[var(--color-primary)] transition-colors">
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold dark:text-white text-sm">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-3 group-hover:text-[var(--color-primary)] transition-colors" />
          </Link>
        ))}
      </div>

      {/* ── Add more dashboard widgets below ─────────────────────────── */}
    </div>
  );
}
