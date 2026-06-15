'use client';
import { useEffect, useState } from 'react';
import { loadAllSettings, saveSettings } from '@/lib/platformSettings';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { EmailSettings } from '@/types';
import { clsx } from 'clsx';

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailSettings>({ provider: 'emailjs' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAllSettings().then(s => setSettings(s.email)); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings('email', settings);
      toast('Email settings saved!', 'success');
    } catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-black text-white">Email Settings</h1>

      {/* Provider selector */}
      <div className="grid grid-cols-2 gap-3">
        {(['emailjs', 'smtp'] as const).map(p => (
          <button key={p} onClick={() => setSettings(s => ({ ...s, provider: p }))}
            className={clsx('p-4 rounded-2xl border text-left transition-colors', settings.provider === p ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-white/10 bg-white/5')}>
            <p className="font-bold text-white text-sm">{p === 'emailjs' ? 'EmailJS' : 'SMTP / Custom'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{p === 'emailjs' ? 'Simple client-side email' : 'Your own mail server'}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        {settings.provider === 'emailjs' ? (
          <>
            <Input label="Service ID" value={settings.emailjsServiceId || ''} onChange={e => setSettings(s => ({ ...s, emailjsServiceId: e.target.value }))} placeholder="service_xxxxxxx" />
            <Input label="Template ID" value={settings.emailjsTemplateId || ''} onChange={e => setSettings(s => ({ ...s, emailjsTemplateId: e.target.value }))} placeholder="template_xxxxxxx" />
            <Input label="Public key" value={settings.emailjsPublicKey || ''} onChange={e => setSettings(s => ({ ...s, emailjsPublicKey: e.target.value }))} placeholder="xxxxxxxxxxxxxxxxxxxx" />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input label="SMTP host" value={settings.smtpHost || ''} onChange={e => setSettings(s => ({ ...s, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
              <Input label="Port" type="number" value={settings.smtpPort?.toString() || ''} onChange={e => setSettings(s => ({ ...s, smtpPort: Number(e.target.value) }))} placeholder="587" />
            </div>
            <Input label="Username" value={settings.smtpUser || ''} onChange={e => setSettings(s => ({ ...s, smtpUser: e.target.value }))} placeholder="you@domain.com" />
            <Input label="Password / App password" type="password" value={settings.smtpPass || ''} onChange={e => setSettings(s => ({ ...s, smtpPass: e.target.value }))} placeholder="••••••••••••" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="From name" value={settings.fromName || ''} onChange={e => setSettings(s => ({ ...s, fromName: e.target.value }))} placeholder="My Platform" />
              <Input label="From email" value={settings.fromEmail || ''} onChange={e => setSettings(s => ({ ...s, fromEmail: e.target.value }))} placeholder="noreply@domain.com" />
            </div>
          </>
        )}
        <Button type="submit" loading={saving} className="w-full">Save email settings</Button>
      </form>

      {/* DNS guidance */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <h3 className="text-sm font-bold text-white mb-3">DNS Records (for custom domain email)</h3>
        <p className="text-xs text-gray-400 mb-3">Add these records to your domain's DNS to improve email deliverability:</p>
        <div className="space-y-2">
          {[
            { type: 'TXT', name: '@', value: 'v=spf1 include:_spf.google.com ~all' },
            { type: 'CNAME', name: 'mail._domainkey', value: 'mail._domainkey.yourprovider.com' },
            { type: 'TXT', name: '_dmarc', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com' },
          ].map(r => (
            <div key={r.type + r.name} className="text-xs font-mono bg-black/30 rounded-lg px-3 py-2 text-gray-300">
              <span className="text-[var(--color-primary)] mr-2">{r.type}</span>
              <span className="text-gray-400 mr-2">{r.name}</span>
              <span>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
