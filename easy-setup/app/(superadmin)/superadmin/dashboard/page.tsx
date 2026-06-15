'use client';
import Link from 'next/link';
import { Palette, Mail, Users, FileText } from 'lucide-react';

const cards = [
  { href: '/superadmin/platform', icon: Palette, label: 'Platform & Branding', desc: 'Name, colors, logo, SEO, toggles', color: 'bg-indigo-500' },
  { href: '/superadmin/email', icon: Mail, label: 'Email Settings', desc: 'Provider config and DNS records', color: 'bg-blue-500' },
  { href: '/superadmin/admins', icon: Users, label: 'Admin Staff', desc: 'Manage roles and access', color: 'bg-purple-500' },
  { href: '/superadmin/audit', icon: FileText, label: 'Audit Logs', desc: 'Track all admin actions', color: 'bg-orange-500' },
];

export default function SuperAdminDashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-2">Super Admin</h1>
      <p className="text-gray-500 mb-8 text-sm">Full platform control panel</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(c => (
          <Link key={c.href} href={c.href}
            className="group p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
            <div className={`w-10 h-10 ${c.color} rounded-xl flex items-center justify-center mb-4`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-white mb-1">{c.label}</p>
            <p className="text-sm text-gray-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
