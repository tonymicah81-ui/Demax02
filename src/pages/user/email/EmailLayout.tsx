import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Mail, FileText, Users, Settings, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../../../AuthContext';
import { getUserEmailSubscription } from '../../../lib/userEmailService';
import { cn } from '../../../utils/cn';

export default function EmailLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserEmailSubscription(user.uid).then(s => {
      setSub(s);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Email Service...</p>
      </div>
    );
  }

  if (!sub || sub.status !== 'active') {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Lock className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Email Service Not Active</h2>
          <p className="text-slate-400 text-sm mt-2">Subscribe to an email plan to access this section.</p>
        </div>
        <button
          onClick={() => navigate('/subscription')}
          className="px-8 py-3 bg-brand-accent text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-brand-accent/90 transition-colors"
        >
          View Plans
        </button>
      </div>
    );
  }

  const isPro = sub.tier === 'pro';

  const tabs = [
    { to: '/email/mail', label: 'Mail', icon: Mail },
    { to: '/email/templates', label: 'Templates', icon: FileText },
    ...(isPro ? [{ to: '/email/contacts', label: 'Contacts', icon: Users }] : []),
    { to: '/email/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-brand-border dark:border-white/5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Email Service</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">
            {isPro ? 'Pro Plan — Bulk & Multi-Address' : 'Basic Plan — Single Address'}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isPro ? 'bg-amber-500/10 text-amber-500' : 'bg-brand-accent/10 text-brand-accent'}`}>
          {isPro ? '⚡ Pro' : 'Basic'}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              isActive
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ sub, isPro }} />
    </div>
  );
}
