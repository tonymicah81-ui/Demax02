'use client';
import { useEffect, useState } from 'react';
import { loadAllSettings, saveSettings } from '@/lib/platformSettings';
import { uploadToCloudinary } from '@/lib/cloudinaryService';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { logAction } from '@/lib/auditService';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function PlatformSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [branding, setBranding] = useState({ platformName: '', tagline: '', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', logoUrl: '', faviconUrl: '' });
  const [seo, setSeo] = useState({ metaTitle: '', metaDescription: '', ogImageUrl: '' });
  const [toggles, setToggles] = useState({ registrationOpen: true, maintenanceMode: false, maintenanceMessage: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);

  useEffect(() => {
    loadAllSettings().then(s => {
      setBranding(s.branding);
      setSeo(s.seo);
      setToggles(s.toggles);
    });
  }, []);

  async function handleUpload(type: 'logo' | 'favicon', file: File) {
    setUploading(type);
    try {
      const { url } = await uploadToCloudinary(file);
      setBranding(b => ({ ...b, [type === 'logo' ? 'logoUrl' : 'faviconUrl']: url }));
      toast(`${type} uploaded`, 'success');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(null); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        saveSettings('branding', branding),
        saveSettings('seo', seo),
        saveSettings('toggles', toggles),
      ]);
      await logAction({ actorId: user!.uid, actorEmail: user!.email!, actorRole: user!.role, action: 'update_platform_settings' });
      toast('Platform settings saved!', 'success');
    } catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-black text-white">Platform & Branding</h1>

      {/* Branding */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white">Branding</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Platform name" value={branding.platformName} onChange={e => setBranding(b => ({ ...b, platformName: e.target.value }))} />
          <Input label="Tagline" value={branding.tagline} onChange={e => setBranding(b => ({ ...b, tagline: e.target.value }))} />
          <Input label="Primary color" type="color" value={branding.primaryColor} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} />
          <Input label="Secondary color" type="color" value={branding.secondaryColor} onChange={e => setBranding(b => ({ ...b, secondaryColor: e.target.value }))} />
        </div>
        {/* Logo upload */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Logo</p>
            <div className="w-14 h-14 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center">
              {branding.logoUrl ? <Image src={branding.logoUrl} alt="logo" width={56} height={56} className="object-contain" /> : <span className="text-2xl font-black text-white">{branding.platformName.charAt(0) || 'P'}</span>}
            </div>
          </div>
          <label className="cursor-pointer">
            <Button size="sm" variant="secondary" as="span" loading={uploading === 'logo'}>Upload logo</Button>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('logo', f); }} />
          </label>
          <label className="cursor-pointer">
            <Button size="sm" variant="secondary" as="span" loading={uploading === 'favicon'}>Upload favicon</Button>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload('favicon', f); }} />
          </label>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white">SEO</h2>
        <Input label="Meta title" value={seo.metaTitle} onChange={e => setSeo(s => ({ ...s, metaTitle: e.target.value }))} />
        <Input label="Meta description" value={seo.metaDescription} onChange={e => setSeo(s => ({ ...s, metaDescription: e.target.value }))} />
        <Input label="OG image URL" value={seo.ogImageUrl} onChange={e => setSeo(s => ({ ...s, ogImageUrl: e.target.value }))} />
      </div>

      {/* Toggles */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white">Platform Toggles</h2>
        {[
          { key: 'registrationOpen', label: 'Registration open', desc: 'Allow new users to sign up' },
          { key: 'maintenanceMode', label: 'Maintenance mode', desc: 'Show maintenance page to non-admins' },
        ].map(t => (
          <div key={t.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-white">{t.label}</p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={toggles[t.key as keyof typeof toggles] as boolean}
                onChange={e => setToggles(v => ({ ...v, [t.key]: e.target.checked }))} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-[var(--color-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        ))}
        {toggles.maintenanceMode && (
          <Input label="Maintenance message" value={toggles.maintenanceMessage} onChange={e => setToggles(v => ({ ...v, maintenanceMessage: e.target.value }))} placeholder="We'll be back soon..." />
        )}
      </div>

      <Button onClick={handleSave} loading={saving} className="w-full" size="lg">Save all settings</Button>
    </div>
  );
}
