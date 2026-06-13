import { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Trash2, Wifi, WifiOff, Server } from 'lucide-react';
import { Card, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../AuthContext';
import { getUserEmailSubscription, saveUserEmailSubscription, UserSmtpConfig } from '../../../lib/userEmailService';
import { useOutletContext } from 'react-router-dom';

type Provider = 'gmail' | 'zoho' | 'yahoo' | 'smtp' | 'custom';

const PROVIDER_LABELS: Record<Provider, string> = {
  gmail: 'Google (Gmail)',
  zoho: 'Zoho Mail',
  yahoo: 'Yahoo Mail',
  smtp: 'Standard SMTP',
  custom: 'Custom',
};

const BLANK_CONFIG: UserSmtpConfig = {
  label: 'My Email', emailAddress: '', provider: 'emailjs', host: '',
  port: 587, username: '', password: '', fromName: '', fromAddress: '', ssl: true, connected: false,
};

export default function EmailSettings() {
  const { user } = useAuth();
  const { sub, isPro } = useOutletContext<{ sub: any; isPro: boolean }>();
  const [configs, setConfigs] = useState<UserSmtpConfig[]>([]);
  const [provider, setProvider] = useState<Provider>('smtp');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (sub?.smtpConfigs) setConfigs(sub.smtpConfigs);
    if (sub?.provider) setProvider(sub.provider as Provider);
  }, [sub]);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function addConfig() {
    if (!isPro && configs.length >= 1) return showMsg('Basic plan supports one email address. Upgrade to Pro for multiple.');
    setConfigs(p => [...p, { ...BLANK_CONFIG, label: `Email ${p.length + 1}`, provider: 'emailjs' }]);
  }

  function updConfig(idx: number, key: keyof UserSmtpConfig, val: any) {
    setConfigs(p => p.map((c, i) => i === idx ? { ...c, [key]: val } : c));
  }

  function removeConfig(idx: number) {
    setConfigs(p => p.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserEmailSubscription(user.uid, { smtpConfigs: configs, provider });
      showMsg('Settings saved');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.includes('failed') || toast.includes('Basic') ? 'bg-red-600' : 'bg-brand-success'}`}>{toast}</div>}

      <Card className="space-y-4">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Server className="w-4 h-4 text-brand-accent" /> Email Provider</CardTitle>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PROVIDER_LABELS) as Provider[]).map(p => (
            <button key={p} onClick={() => setProvider(p)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${provider === p ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'}`}>
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
      </Card>

      {configs.map((cfg, idx) => (
        <Card key={idx} className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cfg.connected ? <Wifi className="w-4 h-4 text-brand-success" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              <input value={cfg.label} onChange={e => updConfig(idx, 'label', e.target.value)} className="bg-transparent text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight focus:outline-none border-b border-transparent focus:border-brand-accent" />
            </div>
            {(isPro || configs.length > 1) && (
              <button onClick={() => removeConfig(idx)} className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-400 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><label className={labelClass}>Email Address</label><input type="email" value={cfg.emailAddress || ''} onChange={e => updConfig(idx, 'emailAddress', e.target.value)} className={inputClass} placeholder="yourname@domain.com" /></div>
            <div className="space-y-2"><label className={labelClass}>Display Name</label><input value={cfg.fromName || ''} onChange={e => updConfig(idx, 'fromName', e.target.value)} className={inputClass} placeholder="Your Name or Business" /></div>
          </div>

          {(provider === 'smtp' || provider === 'custom' || provider === 'zoho') && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className={labelClass}>SMTP Host</label><input value={cfg.host || ''} onChange={e => updConfig(idx, 'host', e.target.value)} className={inputClass} placeholder={provider === 'zoho' ? 'smtp.zoho.com' : provider === 'yahoo' ? 'smtp.mail.yahoo.com' : 'smtp.gmail.com'} /></div>
              <div className="space-y-2"><label className={labelClass}>Port</label><input type="number" value={cfg.port || ''} onChange={e => updConfig(idx, 'port', Number(e.target.value))} className={inputClass} placeholder="587" /></div>
              <div className="space-y-2"><label className={labelClass}>Username</label><input value={cfg.username || ''} onChange={e => updConfig(idx, 'username', e.target.value)} className={inputClass} placeholder="your@email.com" /></div>
              <div className="space-y-2"><label className={labelClass}>Password / App Password</label><input type="password" value={cfg.password || ''} onChange={e => updConfig(idx, 'password', e.target.value)} className={inputClass} placeholder="••••••••" /></div>
              <div className="flex items-center gap-3 col-span-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
                <input type="checkbox" id={`ssl-${idx}`} checked={!!cfg.ssl} onChange={e => updConfig(idx, 'ssl', e.target.checked)} className="w-4 h-4 accent-brand-accent" />
                <label htmlFor={`ssl-${idx}`} className="text-sm font-bold text-brand-text-bold dark:text-white">Use SSL/TLS</label>
              </div>
            </div>
          )}

          {provider === 'gmail' && (
            <div className="p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-xl">
              <p className="text-[11px] text-brand-accent font-bold leading-relaxed">
                For Gmail: enable 2-Step Verification, then create an App Password at <strong>myaccount.google.com/apppasswords</strong>. Use your Gmail address as username and the App Password as password.
              </p>
            </div>
          )}

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit ${cfg.connected ? 'bg-brand-success/10 text-brand-success' : 'bg-red-950/20 text-red-400'}`}>
            {cfg.connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {cfg.connected ? 'Connected' : 'Not Connected'}
          </div>
        </Card>
      ))}

      <div className="flex gap-3">
        <Button variant="outline" onClick={addConfig} className="gap-2">
          <Plus className="w-4 h-4" />
          {isPro ? 'Add Another Email' : 'Add Email Address'}
        </Button>
        <Button onClick={save} disabled={saving} className="bg-brand-accent text-white gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
