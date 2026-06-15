import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/ui/Toast';
import { loadAllSettings, buildCssVariables } from '@/lib/platformSettings';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await loadAllSettings();
    return {
      title: settings.seo.metaTitle || settings.branding.platformName,
      description: settings.seo.metaDescription,
      openGraph: { images: settings.seo.ogImageUrl ? [settings.seo.ogImageUrl] : [] },
      icons: { icon: settings.branding.faviconUrl || '/favicon.ico' },
    };
  } catch {
    return { title: 'My Platform' };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await loadAllSettings().catch(() => null);
  const cssVars = settings ? buildCssVariables(settings.branding) : '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {cssVars && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}})()`
        }} />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        <AuthProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
