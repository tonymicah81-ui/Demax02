import Link from 'next/link';
import { loadAllSettings } from '@/lib/platformSettings';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default async function LandingPage() {
  const settings = await loadAllSettings().catch(() => null);
  const branding = settings?.branding;
  const toggles = settings?.toggles;

  if (toggles?.maintenanceMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold dark:text-white mb-2">Maintenance Mode</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">{toggles.maintenanceMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Logo logoUrl={branding?.logoUrl} platformName={branding?.platformName} size={36} />
          <span className="font-black text-lg dark:text-white">{branding?.platformName || 'My Platform'}</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Sign in
          </Link>
          {toggles?.registrationOpen !== false && (
            <Link href="/signup" className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90">
              Get started
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest mb-8">
            Welcome
          </div>
          <h1 className="text-5xl lg:text-6xl font-black dark:text-white mb-6 leading-tight">
            {branding?.platformName || 'My Platform'}
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            {branding?.tagline || 'Your SaaS, your rules.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {toggles?.registrationOpen !== false && (
              <Link href="/signup" className="px-8 py-3.5 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:opacity-90 text-sm">
                Create free account
              </Link>
            )}
            <Link href="/login" className="px-8 py-3.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-20 max-w-5xl mx-auto w-full">
        {[
          { icon: '🔐', title: 'Secure Auth', desc: 'Role-based access control for users, admins, and super admins.' },
          { icon: '💬', title: 'Live Chat', desc: 'Real-time support chat between your users and your team.' },
          { icon: '⚙️', title: 'Full Control', desc: 'Super admin panel to customize branding, email, and platform settings.' },
        ].map(f => (
          <div key={f.title} className="p-6 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold dark:text-white mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/10 px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <span>© {new Date().getFullYear()} {branding?.platformName || 'My Platform'}. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-200">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-200">Privacy</Link>
          <Link href="/staff" className="hover:text-gray-600 dark:hover:text-gray-200">Staff</Link>
        </div>
      </footer>
    </div>
  );
}
