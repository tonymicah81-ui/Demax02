import { useState, useEffect } from 'react';
import { Save, Loader2, Wifi, WifiOff, Server } from 'lucide-react';
import { Card, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { db, doc, setDoc, getDoc, serverTimestamp } from '../../../firebase';

type ProviderType = 'emailjs' | 'smtp' | 'zoho';
type EmailType = 'support' | 'help' | 'noreply';

interface SmtpConfig {
  provider: ProviderType;
  serviceId?: string;
  templateId?: string;
  publicKey?: string;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  fromName?: string;
  fromAddress?: string;
  ssl?: boolean;
  mx1?: string;
  mx2?: string;
  dkim?: string;
  spf?: string;
  connected?: boolean;
}

const DEFAULT_CONFIG: SmtpConfig = { provider: 'emailjs', connected: false };

const EMAIL_TYPES: EmailType[] = ['support', 'help', 'noreply'];
const TYPE_LABELS: Record<EmailType, string> = { support: 'Support', help: 'Help', noreply: 'No-Reply' };

export default function SmtpSettings() {
  const [provider, setProvider] = useState<ProviderType>('emailjs');
  const [activeType, setActiveType] = useState<EmailType>('support');
  const [configs, setConfigs] = useState<Record<EmailType, SmtpConfig>>({
    support: { ...DEFAULT_CONFIG },
    help: { ...DEFAULT_CONFIG },
    noreply: { ...DEFAULT_CONFIG },
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'smtp_config')).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as Record<EmailType, SmtpConfig>;
        setConfigs({ support: { ...DEFAULT_CONFIG }, help: { ...DEFAULT_CONFIG }, noreply: { ...DEFAULT_CONFIG }, ...data });
        setProvider(data.support?.provider || 'emailjs');
      }
    });
  }, []);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function upd(key: keyof SmtpConfig, val: any) {
    setConfigs(p => ({ ...p, [activeType]: { ...p[activeType], [key]: val, provider } }));
  }

  async function save() {
    setSaving(true);
    try {
      const toSave: Record<EmailType, SmtpConfig> = {
        support: { ...configs.support, provider },
        help: { ...configs.help, provider },
        noreply: { ...configs.noreply, provider },
      };
      await setDoc(doc(db, 'platform_settings', 'smtp_config'), { ...toSave, updatedAt: serverTimestamp() }, { merge: true });
      showMsg('SMTP settings saved');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const cfg = configs[activeType];
      if (cfg.provider === 'emailjs' && cfg.serviceId && cfg.publicKey) {
        const { default: emailjs } = await import('@emailjs/browser');
        await emailjs.send(cfg.serviceId, cfg.templateId || '', { test: 'ping' }, cfg.publicKey);
        await setDoc(doc(db, 'platform_settings', 'smtp_config'), { [activeType]: { ...cfg, connected: true }, updatedAt: serverTimestamp() }, { merge: true });
        setConfigs(p => ({ ...p, [activeType]: { ...p[activeType], connected: true } }));
        showMsg('Connection successful!');
      } else {
        showMsg('Fill in all required fields to test');
      }
    } catch { showMsg('Connection failed — check credentials'); }
    finally { setTesting(false); }
  }

  const cfg = configs[activeType];
  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.includes('failed') || toast.includes('Failed') ? 'bg-red-600' : 'bg-brand-success'}`}>{toast}</div>}

      <Card className="space-y-6">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
          <Server className="w-4 h-4 text-brand-accent" /> SMTP & DNS Configuration
        </CardTitle>

        <div className="space-y-2">
          <label className={labelClass}>Email Provider</label>
          <div className="flex gap-2">
            {(['emailjs', 'smtp', 'zoho'] as ProviderType[]).map(p => (
              <button key={p} onClick={() => setProvider(p)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${provider === p ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'}`}>
                {p === 'emailjs' ? 'EmailJS (Test)' : p === 'smtp' ? 'Standard SMTP' : 'Zoho Mail'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {EMAIL_TYPES.map(t => (
            <button key={t} onClick={() => setActiveType(t)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === t ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'}`}>
              {cfg.connected && activeType === t && <Wifi className="w-3 h-3 text-brand-success" />}
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${cfg.connected ? 'bg-brand-success/10 text-brand-success' : 'bg-red-950/20 text-red-400'}`}>
          {cfg.connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {cfg.connected ? 'Connected' : 'Not Connected'} — {TYPE_LABELS[activeType]}
        </div>

        {provider === 'emailjs' && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2"><label className={labelClass}>Service ID</label><input type="text" value={cfg.serviceId || ''} onChange={e => upd('serviceId', e.target.value)} className={inputClass} placeholder="service_xxxxx" /></div>
            <div className="space-y-2"><label className={labelClass}>Template ID</label><input type="text" value={cfg.templateId || ''} onChange={e => upd('templateId', e.target.value)} className={inputClass} placeholder="template_xxxxx" /></div>
            <div className="space-y-2"><label className={labelClass}>Public Key</label><input type="text" value={cfg.publicKey || ''} onChange={e => upd('publicKey', e.target.value)} className={inputClass} placeholder="Your_public_key" /></div>
          </div>
        )}

        {provider === 'smtp' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><label className={labelClass}>SMTP Host</label><input type="text" value={cfg.host || ''} onChange={e => upd('host', e.target.value)} className={inputClass} placeholder="smtp.example.com" /></div>
            <div className="space-y-2"><label className={labelClass}>Port</label><input type="number" value={cfg.port || ''} onChange={e => upd('port', e.target.value)} className={inputClass} placeholder="587" /></div>
            <div className="space-y-2"><label className={labelClass}>Username</label><input type="text" value={cfg.username || ''} onChange={e => upd('username', e.target.value)} className={inputClass} placeholder="user@example.com" /></div>
            <div className="space-y-2"><label className={labelClass}>Password</label><input type="password" value={cfg.password || ''} onChange={e => upd('password', e.target.value)} className={inputClass} placeholder="••••••••" /></div>
            <div className="space-y-2"><label className={labelClass}>From Name</label><input type="text" value={cfg.fromName || ''} onChange={e => upd('fromName', e.target.value)} className={inputClass} placeholder="Durex Team" /></div>
            <div className="space-y-2"><label className={labelClass}>From Address</label><input type="email" value={cfg.fromAddress || ''} onChange={e => upd('fromAddress', e.target.value)} className={inputClass} placeholder="noreply@example.com" /></div>
            <div className="flex items-center gap-3 col-span-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
              <input type="checkbox" id="ssl" checked={!!cfg.ssl} onChange={e => upd('ssl', e.target.checked)} className="w-4 h-4 accent-brand-accent" />
              <label htmlFor="ssl" className="text-sm font-bold text-brand-text-bold dark:text-white">Use SSL/TLS</label>
            </div>
          </div>
        )}

        {provider === 'zoho' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><label className={labelClass}>MX1 Host</label><input type="text" value={cfg.mx1 || ''} onChange={e => upd('mx1', e.target.value)} className={inputClass} placeholder="mx.zoho.com" /></div>
            <div className="space-y-2"><label className={labelClass}>MX2 Host</label><input type="text" value={cfg.mx2 || ''} onChange={e => upd('mx2', e.target.value)} className={inputClass} placeholder="mx2.zoho.com" /></div>
            <div className="space-y-2"><label className={labelClass}>SMTP Host</label><input type="text" value={cfg.host || ''} onChange={e => upd('host', e.target.value)} className={inputClass} placeholder="smtp.zoho.com" /></div>
            <div className="space-y-2"><label className={labelClass}>Port</label><input type="number" value={cfg.port || ''} onChange={e => upd('port', e.target.value)} className={inputClass} placeholder="465" /></div>
            <div className="space-y-2"><label className={labelClass}>Username</label><input type="text" value={cfg.username || ''} onChange={e => upd('username', e.target.value)} className={inputClass} placeholder="user@yourdomain.com" /></div>
            <div className="space-y-2"><label className={labelClass}>Password</label><input type="password" value={cfg.password || ''} onChange={e => upd('password', e.target.value)} className={inputClass} placeholder="••••••••" /></div>
            <div className="space-y-2"><label className={labelClass}>From Address</label><input type="email" value={cfg.fromAddress || ''} onChange={e => upd('fromAddress', e.target.value)} className={inputClass} placeholder="support@yourdomain.com" /></div>
            <div className="space-y-2"><label className={labelClass}>DKIM Key</label><input type="text" value={cfg.dkim || ''} onChange={e => upd('dkim', e.target.value)} className={inputClass} placeholder="v=DKIM1; k=rsa; p=..." /></div>
            <div className="space-y-2 md:col-span-2"><label className={labelClass}>SPF Record</label><input type="text" value={cfg.spf || ''} onChange={e => upd('spf', e.target.value)} className={inputClass} placeholder="v=spf1 include:zoho.com ~all" /></div>
          </div>
        )}

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${cfg.connected ? 'bg-brand-success/10 text-brand-success' : 'bg-red-950/20 text-red-400'}`}>
          {cfg.connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {cfg.connected ? 'Connected' : 'Not Connected'}
        </div>

        <div className="flex gap-3">
          <Button onClick={testConnection} disabled={testing} variant="outline" className="gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Connection
          </Button>
          <Button onClick={save} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
