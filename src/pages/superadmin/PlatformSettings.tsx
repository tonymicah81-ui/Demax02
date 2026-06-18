import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Cloud, Palette, Mail, Save, Loader2, CheckCircle2,
  XCircle, Eye, EyeOff, ToggleLeft, ToggleRight, Settings,
  Key, Code2, Image, AlertTriangle, RefreshCw, Bot, DollarSign, CreditCard
} from 'lucide-react';
import PaymentMethodsPanel from '../../components/superadmin/PaymentMethodsPanel';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../AuthContext';
import {
  loadSetting, saveSetting,
  loadVaultConfig, saveVaultConfig,
  CloudinarySettings, LoadingSettings, GeneralSettings
} from '../../lib/platformSettings';
import { db, doc, updateDoc, setDoc, getDoc, serverTimestamp } from '../../firebase';

function BrandingPanel() {
  const [logoUrl, setLogoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'hero' | null>(null);

  const inp = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const lbl = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'branding')).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setLogoUrl(d.logoUrl || '');
        setHeroImageUrl(d.heroImageUrl || '');
      }
    });
  }, []);

  const uploadImage = async (file: File, field: 'logo' | 'hero') => {
    setUploading(field);
    try {
      const cloudSnap = await getDoc(doc(db, 'platform_settings', 'cloudinary'));
      const cld = cloudSnap.exists() ? cloudSnap.data() : {};
      const cloudName = cld.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const preset = cld.uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !preset) throw new Error('Cloudinary not configured');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', preset);
      fd.append('folder', 'branding');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
      if (field === 'logo') setLogoUrl(data.secure_url);
      else setHeroImageUrl(data.secure_url);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || err));
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'branding'), { logoUrl, heroImageUrl, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  return (
    <Card className="space-y-6">
      <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
        <Image className="w-4 h-4 text-brand-accent" /> Platform Branding
      </CardTitle>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Upload a platform logo (shown in sidebar, chat widget, and loading screen) and a hero image (shown on the landing page). Changes apply globally in real-time.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Logo */}
        <div className="space-y-4">
          <label className={lbl}>Platform Logo</label>
          {logoUrl && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-border dark:border-white/10 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
            </div>
          )}
          <div className="space-y-2">
            <input
              type="text"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              className={inp}
              placeholder="https://... or upload below"
            />
            <label className="flex items-center gap-2 w-full cursor-pointer">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors">
                {uploading === 'logo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                {uploading === 'logo' ? 'Uploading...' : 'Upload Logo Image'}
              </div>
              <input type="file" accept="image/*" className="hidden" disabled={!!uploading} onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file, 'logo');
                e.target.value = '';
              }} />
            </label>
          </div>
        </div>

        {/* Hero Image */}
        <div className="space-y-4">
          <label className={lbl}>Landing Page Hero Image</label>
          {heroImageUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-brand-border dark:border-white/10 bg-slate-100 dark:bg-slate-900">
              <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-2">
            <input
              type="text"
              value={heroImageUrl}
              onChange={e => setHeroImageUrl(e.target.value)}
              className={inp}
              placeholder="https://... or upload below"
            />
            <label className="flex items-center gap-2 w-full cursor-pointer">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors">
                {uploading === 'hero' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                {uploading === 'hero' ? 'Uploading...' : 'Upload Hero Image'}
              </div>
              <input type="file" accept="image/*" className="hidden" disabled={!!uploading} onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file, 'hero');
                e.target.value = '';
              }} />
            </label>
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className={`gap-2 ${saved ? 'bg-brand-success' : 'bg-brand-accent'} text-white`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Branding'}
      </Button>
    </Card>
  );
}

function AdsPanel() {
  const [config, setConfig] = useState({ adsEnabled: false, adsenseClientId: '', adsSlotId: '', gtmId: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inp = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const lbl = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'ads')).then(snap => {
      if (snap.exists()) setConfig(c => ({ ...c, ...snap.data() }));
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'ads'), { ...config, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  return (
    <Card className="space-y-6">
      <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
        <Code2 className="w-4 h-4 text-brand-accent" /> Google Ads / AdSense
      </CardTitle>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Configure Google AdSense to display ads in the store between product listings. Enable the toggle, then enter your Publisher ID and Ad Slot ID from your AdSense account.
      </p>

      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
        <button
          onClick={() => setConfig(c => ({ ...c, adsEnabled: !c.adsEnabled }))}
          className="text-brand-success transition-transform hover:scale-105"
        >
          {config.adsEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
        </button>
        <div>
          <p className="text-sm font-black dark:text-white">Ad Display: {config.adsEnabled ? "Enabled" : "Disabled"}</p>
          <p className="text-[10px] text-slate-400">When enabled, ads appear in the store product grid every 6 items</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={lbl}>AdSense Publisher ID</label>
          <input
            type="text"
            value={config.adsenseClientId}
            onChange={e => setConfig(c => ({ ...c, adsenseClientId: e.target.value }))}
            className={inp}
            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
          />
          <p className="text-[10px] text-slate-400">Found in your AdSense account under Account Info</p>
        </div>
        <div className="space-y-2">
          <label className={lbl}>Ad Unit Slot ID</label>
          <input
            type="text"
            value={config.adsSlotId}
            onChange={e => setConfig(c => ({ ...c, adsSlotId: e.target.value }))}
            className={inp}
            placeholder="1234567890"
          />
          <p className="text-[10px] text-slate-400">Found under Ads → By Ad Unit in AdSense</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={lbl}>Google Tag Manager ID <span className="font-normal normal-case text-slate-400">(optional)</span></label>
          <input
            type="text"
            value={config.gtmId}
            onChange={e => setConfig(c => ({ ...c, gtmId: e.target.value }))}
            className={inp}
            placeholder="GTM-XXXXXXX"
          />
          <p className="text-[10px] text-slate-400">If set, the GTM script is injected into the page head automatically</p>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className={`gap-2 ${saved ? 'bg-brand-success' : 'bg-brand-accent'} text-white`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Ad Settings'}
      </Button>
    </Card>
  );
}

function SmtpSettingsPanel() {
  const [data, setData] = useState({ provider: 'emailjs', serviceId: '', templateId: '', publicKey: '', host: '', port: 587, username: '', password: '', fromName: 'Platform Support', fromAddress: '', ssl: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'smtp')).then(snap => { if (snap.exists()) setData(d => ({ ...d, ...snap.data() })); });
  }, []);

  async function save() {
    setSaving(true);
    try { await setDoc(doc(db, 'platform_settings', 'smtp'), { ...data, updatedAt: serverTimestamp() }, { merge: true }); setSaved(true); setTimeout(() => setSaved(false), 2500); } catch {}
    setSaving(false);
  }

  const inp = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const lbl = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-5">
      <div className="space-y-2"><label className={lbl}>Provider</label>
        <select value={data.provider} onChange={e => setData(d => ({ ...d, provider: e.target.value }))} className={inp}>
          <option value="emailjs">EmailJS (browser-side)</option>
          <option value="smtp">Direct SMTP</option>
          <option value="zoho">Zoho Mail</option>
        </select>
      </div>
      {data.provider === 'emailjs' ? (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2"><label className={lbl}>Service ID</label><input value={data.serviceId} onChange={e => setData(d => ({ ...d, serviceId: e.target.value }))} className={inp} placeholder="service_xxxxx" /></div>
          <div className="space-y-2"><label className={lbl}>Template ID</label><input value={data.templateId} onChange={e => setData(d => ({ ...d, templateId: e.target.value }))} className={inp} placeholder="template_xxxxx" /></div>
          <div className="space-y-2"><label className={lbl}>Public Key</label><input value={data.publicKey} onChange={e => setData(d => ({ ...d, publicKey: e.target.value }))} className={inp} placeholder="your_public_key" /></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><label className={lbl}>SMTP Host</label><input value={data.host} onChange={e => setData(d => ({ ...d, host: e.target.value }))} className={inp} placeholder="smtp.example.com" /></div>
          <div className="space-y-2"><label className={lbl}>Port</label><input type="number" value={data.port} onChange={e => setData(d => ({ ...d, port: Number(e.target.value) }))} className={inp} /></div>
          <div className="space-y-2"><label className={lbl}>Username</label><input value={data.username} onChange={e => setData(d => ({ ...d, username: e.target.value }))} className={inp} /></div>
          <div className="space-y-2"><label className={lbl}>Password</label><input type="password" value={data.password} onChange={e => setData(d => ({ ...d, password: e.target.value }))} className={inp} /></div>
          <div className="space-y-2"><label className={lbl}>From Name</label><input value={data.fromName} onChange={e => setData(d => ({ ...d, fromName: e.target.value }))} className={inp} /></div>
          <div className="space-y-2"><label className={lbl}>From Address</label><input type="email" value={data.fromAddress} onChange={e => setData(d => ({ ...d, fromAddress: e.target.value }))} className={inp} /></div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5 col-span-2">
            <input type="checkbox" checked={data.ssl} onChange={e => setData(d => ({ ...d, ssl: e.target.checked }))} className="w-4 h-4 accent-brand-accent" />
            <span className="text-sm font-bold dark:text-white">Use SSL/TLS</span>
          </div>
        </div>
      )}
      <Button onClick={save} disabled={saving} className={`gap-2 ${saved ? 'bg-brand-success' : 'bg-brand-accent'} text-white`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save SMTP Settings'}
      </Button>
    </div>
  );
}

function BotSettingsPanel() {
  const [enabled, setEnabled] = useState(true);
  const [tiers, setTiers] = useState([{ name: 'Basic', price: 5, features: 'Telegram notifications' }, { name: 'Pro', price: 15, features: 'Full bot API access' }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'bot_config')).then(snap => {
      if (snap.exists()) { const d = snap.data(); setEnabled(d.enabled ?? true); if (d.tiers) setTiers(d.tiers); }
    });
  }, []);

  async function save() {
    setSaving(true);
    try { await setDoc(doc(db, 'platform_settings', 'bot_config'), { enabled, tiers, updatedAt: serverTimestamp() }, { merge: true }); setSaved(true); setTimeout(() => setSaved(false), 2500); } catch {}
    setSaving(false);
  }

  const inp = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
        <div><p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">Bot Service</p><p className="text-[10px] text-slate-400 mt-0.5">Enable/disable bot subscriptions for all users</p></div>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-5 h-5 accent-brand-accent cursor-pointer" />
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscription Tiers</p>
        {tiers.map((tier, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-brand-border dark:border-white/5">
            <input value={tier.name} onChange={e => setTiers(t => t.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className={inp + ' text-xs'} placeholder="Tier name" />
            <input type="number" value={tier.price} onChange={e => setTiers(t => t.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))} className={inp + ' text-xs'} placeholder="Price/mo" />
            <input value={tier.features} onChange={e => setTiers(t => t.map((x, i) => i === idx ? { ...x, features: e.target.value } : x))} className={inp + ' text-xs'} placeholder="Features" />
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving} className={`gap-2 ${saved ? 'bg-brand-success' : 'bg-brand-accent'} text-white`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Bot Settings'}
      </Button>
    </div>
  );
}

function PlatformBotPanel() {
  const [data, setData] = useState({
    token: '', chatId: '', enabled: false,
    events: { newUser: true, newDeposit: true, newOrder: true, newFix: true, newVisitorChat: false },
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const inp = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const lbl = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'platform_bot')).then(snap => {
      if (snap.exists()) setData(d => ({ ...d, ...snap.data() }));
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'platform_bot'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  }

  async function testBot() {
    if (!data.token || !data.chatId) return;
    setTesting(true);
    try {
      const res = await fetch(`https://api.telegram.org/bot${data.token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: data.chatId, text: '✅ Platform notification bot connected successfully!' }),
      });
      setTestResult(res.ok);
    } catch { setTestResult(false); }
    setTesting(false);
    setTimeout(() => setTestResult(null), 4000);
  }

  const EVENT_LABELS: { key: keyof typeof data.events; label: string; desc: string }[] = [
    { key: 'newUser', label: 'New User Signup', desc: 'Notify when a new client registers' },
    { key: 'newDeposit', label: 'New Deposit', desc: 'Notify on wallet top-up' },
    { key: 'newOrder', label: 'New Order', desc: 'Notify on store purchase' },
    { key: 'newFix', label: 'New Fix/Issue', desc: 'Notify when a client submits an issue' },
    { key: 'newVisitorChat', label: 'Visitor Chat Started', desc: 'Notify when a site visitor opens the chat widget' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
        <div>
          <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">Platform Notifications</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Receive Telegram alerts for platform events</p>
        </div>
        <input type="checkbox" checked={data.enabled} onChange={e => setData(d => ({ ...d, enabled: e.target.checked }))} className="w-5 h-5 accent-brand-accent cursor-pointer" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={lbl}>Bot Token</label>
          <input type="password" value={data.token} onChange={e => setData(d => ({ ...d, token: e.target.value }))} className={inp} placeholder="1234567890:AAXXXXXX..." />
          <p className="text-[10px] text-slate-400">Get from @BotFather on Telegram</p>
        </div>
        <div className="space-y-2">
          <label className={lbl}>Chat ID</label>
          <input value={data.chatId} onChange={e => setData(d => ({ ...d, chatId: e.target.value }))} className={inp} placeholder="-1001234567890" />
          <p className="text-[10px] text-slate-400">Group/channel ID (use @username for public channels)</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className={lbl}>Trigger Events</p>
        {EVENT_LABELS.map(ev => (
          <div key={ev.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
            <div>
              <p className="text-xs font-black text-brand-text-bold dark:text-white">{ev.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{ev.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={data.events[ev.key]}
              onChange={e => setData(d => ({ ...d, events: { ...d.events, [ev.key]: e.target.checked } }))}
              className="w-4 h-4 accent-brand-accent cursor-pointer"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving} className={`gap-2 ${saved ? 'bg-brand-success' : 'bg-brand-accent'} text-white`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Bot Settings'}
        </Button>
        <Button onClick={testBot} disabled={testing || !data.token || !data.chatId} className="gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : testResult === true ? <CheckCircle2 className="w-4 h-4 text-brand-success" /> : testResult === false ? <XCircle className="w-4 h-4 text-red-500" /> : <Bot className="w-4 h-4" />}
          {testing ? 'Testing...' : testResult === true ? 'Connected!' : testResult === false ? 'Failed' : 'Test Bot'}
        </Button>
      </div>
    </div>
  );
}

type Tab = 'general' | 'vault' | 'loading' | 'cloudinary' | 'email' | 'bot' | 'subscriptions' | 'platformBot' | 'branding' | 'ads' | 'payments';

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ok ? 'bg-brand-success/10 text-brand-success' : 'bg-red-950/30 text-red-400'}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-black text-[11px] uppercase tracking-widest ${type === 'success' ? 'bg-brand-success text-white' : 'bg-red-600 text-white'}`}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

export default function PlatformSettings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // General settings
  const [generalData, setGeneralData] = useState<GeneralSettings>({ supportEmail: 'support@durax.com' });

  // Vault settings (from `vault/config` collection)
  const [vaultStatus, setVaultStatus] = useState<'active' | 'inactive' | ''>('');
  const [vaultPinSet, setVaultPinSet] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [vaultInfo, setVaultInfo] = useState({
    lastTimeVisit: '',
    countTryNumber: 0,
    lastLockTime: '',
  });

  // Loading settings
  const [loadingData, setLoadingData] = useState<LoadingSettings>({ effect: 'default', logoUrl: '', customHTML: '', customCSS: '' });

  // Cloudinary settings
  const [cloudinaryData, setCloudinaryData] = useState<CloudinarySettings>({ cloudName: '', uploadPreset: '', apiKey: '' });
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  // Subscription pricing settings
  const [subPricing, setSubPricing] = useState({ emailBasicPrice: 9, emailProPrice: 29, botPrice: 19 });
  const [savingSubs, setSavingSubs] = useState(false);

  // Super admin personal email
  const [personalEmail, setPersonalEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    loadSetting('general').then(setGeneralData);
    loadSetting('loading').then(setLoadingData);
    loadSetting('subscriptions').then(d => { if (d && d.emailBasicPrice != null) setSubPricing(d); });
    loadSetting('cloudinary').then(d => {
      if (d.cloudName) {
        setCloudinaryData(d);
      } else {
        setCloudinaryData({
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
          uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
          apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
        });
      }
    });
    loadVaultConfig().then(config => {
      setVaultStatus(config.status);
      setVaultPinSet(!!config.pin);
      setVaultInfo({
        lastTimeVisit: config.lastTimeVisit || '',
        countTryNumber: config.countTryNumber || 0,
        lastLockTime: config.lastLockTime || '',
      });
    });
    if (profile) setPersonalEmail((profile as any).personalEmail || '');
  }, [profile]);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function saveSubscriptions() {
    setSavingSubs(true);
    try {
      await saveSetting('subscriptions', subPricing);
      showToast('Subscription pricing saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSavingSubs(false);
    }
  }

  async function saveGeneral() {
    setSaving(true);
    try {
      await saveSetting('general', generalData);
      showToast('General settings saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleVault() {
    if (!vaultPinSet) return showToast('Set a PIN first before activating', 'error');
    setSaving(true);
    try {
      const newStatus = vaultStatus === 'active' ? 'inactive' : 'active';
      await saveVaultConfig({ status: newStatus });
      setVaultStatus(newStatus);
      showToast(`Vault ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update vault', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveVaultPin() {
    if (!newPin || newPin.length < 4) return showToast('PIN must be at least 4 digits', 'error');
    if (newPin !== confirmPin) return showToast('PINs do not match', 'error');
    setSaving(true);
    try {
      // Store plain PIN in Firestore — no backend to hash server-side
      await saveVaultConfig({ pin: newPin });
      setVaultPinSet(true);
      setNewPin('');
      setConfirmPin('');
      showToast('Vault PIN updated', 'success');
    } catch {
      showToast('Failed to update PIN', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function clearVaultLock() {
    setSaving(true);
    try {
      await saveVaultConfig({ countTryNumber: 0, lastLockTime: '' });
      setVaultInfo(prev => ({ ...prev, countTryNumber: 0, lastLockTime: '' }));
      showToast('Vault lock cleared', 'success');
    } catch {
      showToast('Failed to clear lock', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveLoading() {
    setSaving(true);
    try {
      await saveSetting('loading', loadingData);
      showToast('Loading settings saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveCloudinary() {
    setSaving(true);
    try {
      await saveSetting('cloudinary', cloudinaryData);
      showToast('Cloudinary settings saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function testCloudinary() {
    if (!cloudinaryData.cloudName || !cloudinaryData.uploadPreset) {
      return showToast('Fill in Cloud Name and Upload Preset first', 'error');
    }
    setCloudinaryStatus('checking');
    try {
      const fd = new FormData();
      const blob = new Blob(['test'], { type: 'text/plain' });
      fd.append('file', blob, 'test.txt');
      fd.append('upload_preset', cloudinaryData.uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryData.cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        setCloudinaryStatus('ok');
        showToast('Cloudinary connected successfully', 'success');
      } else {
        setCloudinaryStatus('error');
        showToast('Connection failed — check credentials', 'error');
      }
    } catch {
      setCloudinaryStatus('error');
      showToast('Connection failed — check credentials', 'error');
    }
  }

  async function savePersonalEmail() {
    if (!profile) return;
    setSavingEmail(true);
    try {
      await updateDoc(doc(db, 'admins', profile.uid), {
        personalEmail,
        updatedAt: serverTimestamp(),
      });
      showToast('Personal email saved', 'success');
    } catch {
      showToast('Failed to save email', 'error');
    } finally {
      setSavingEmail(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branding', label: 'Branding', icon: Image },
    { id: 'ads', label: 'Google Ads', icon: Code2 },
    { id: 'vault', label: 'Vault', icon: Shield },
    { id: 'loading', label: 'Loading Screen', icon: Palette },
    { id: 'cloudinary', label: 'Cloudinary', icon: Cloud },
  ];

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";
  const textareaClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all dark:text-white resize-none";

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-brand-border dark:border-white/5">
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Platform Settings</h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">System Configuration // Super Admin Only</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-text-bold dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'email' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-text-bold dark:hover:text-white'}`}
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bot' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-text-bold dark:hover:text-white'}`}
        >
          <Settings className="w-3.5 h-3.5" /> Bot
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'subscriptions' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-text-bold dark:hover:text-white'}`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('platformBot')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'platformBot' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-text-bold dark:hover:text-white'}`}
        >
          <Bot className="w-3.5 h-3.5" /> Platform Bot
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-text-bold dark:hover:text-white'}`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Payment Methods
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* GENERAL */}
        {activeTab === 'general' && (
          <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-accent" /> Platform Email
              </CardTitle>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>Support Email (Public)</label>
                  <input
                    type="email"
                    value={generalData.supportEmail}
                    onChange={e => setGeneralData(p => ({ ...p, supportEmail: e.target.value }))}
                    className={inputClass}
                    placeholder="support@durax.com"
                  />
                  <p className="text-[10px] text-slate-400">Displayed in footer, landing page, and contact areas</p>
                </div>
              </div>
              <Button onClick={saveGeneral} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save General Settings
              </Button>
            </Card>

            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-success" /> Your Personal Email
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">This email receives security alerts. It is never shown publicly.</p>
              <div className="grid md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className={labelClass}>Notification Email</label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={e => setPersonalEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>
                <Button onClick={savePersonalEmail} disabled={savingEmail} className="bg-brand-success hover:bg-brand-success/90 text-white gap-2 h-11">
                  {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Email
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* VAULT */}
        {activeTab === 'vault' && (
          <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <div className="flex items-center justify-between">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-success" /> Vault Status
                </CardTitle>
                <StatusBadge ok={vaultStatus === 'active'} label={vaultStatus === 'active' ? 'Active' : 'Inactive'} />
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 space-y-3">
                <p className="text-sm font-bold text-brand-text-bold dark:text-white">How the Vault works</p>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
                  <li>• <strong>Active</strong>: visitors must enter the PIN before seeing the login/signup pages</li>
                  <li>• <strong>Inactive</strong>: vault gate is skipped — pages shown directly</li>
                  <li>• After <strong>5 wrong attempts</strong>, the vault locks for 15 minutes (tracked in Firestore)</li>
                  <li>• PIN is stored as plain text in Firestore (no backend available for hashing)</li>
                  <li>• New staff register with role <code className="text-brand-accent">client</code> — you must manually set <code className="text-brand-accent">admin</code> or <code className="text-brand-accent">super_admin</code> in Firestore</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-brand-border dark:border-white/5">
                <div>
                  <p className="font-black text-brand-text-bold dark:text-white uppercase tracking-tight text-sm">Vault Active</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toggle to enable/disable the PIN gate</p>
                </div>
                <button
                  onClick={toggleVault}
                  disabled={saving || !vaultPinSet}
                  className="text-brand-success disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-105"
                  title={!vaultPinSet ? 'Set a PIN first before activating' : ''}
                >
                  {vaultStatus === 'active'
                    ? <ToggleRight className="w-10 h-10" />
                    : <ToggleLeft className="w-10 h-10 text-slate-400" />}
                </button>
              </div>

              {!vaultPinSet && (
                <div className="flex items-center gap-3 p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Set a PIN below before activating the vault</p>
                </div>
              )}
            </Card>

            {/* Vault Tracking Info */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" /> Live Tracking
                </CardTitle>
                {vaultInfo.lastLockTime && (
                  <Button onClick={clearVaultLock} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-2 text-[10px] h-8 px-4">
                    <RefreshCw className="w-3 h-3" />
                    Clear Lock
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Last Visit', value: vaultInfo.lastTimeVisit ? new Date(vaultInfo.lastTimeVisit).toLocaleString() : 'Never' },
                  { label: 'Failed Attempts', value: String(vaultInfo.countTryNumber || 0) },
                  { label: 'Locked Until', value: vaultInfo.lastLockTime ? new Date(new Date(vaultInfo.lastLockTime).getTime() + 15 * 60 * 1000).toLocaleTimeString() : 'Not locked' },
                ].map(stat => (
                  <div key={stat.label} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xs font-bold text-brand-text-bold dark:text-white truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-accent" /> Set / Change Vault PIN
              </CardTitle>
              {vaultPinSet && (
                <div className="flex items-center gap-2">
                  <StatusBadge ok={true} label="PIN is set" />
                  <span className="text-[10px] text-slate-400">A PIN is currently configured. Fill the form below to change it.</span>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>New PIN</label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      className={inputClass + ' pr-12'}
                      placeholder="Min. 4 digits"
                    />
                    <button type="button" onClick={() => setShowPin(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-accent transition-colors">
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Confirm PIN</label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value)}
                    className={inputClass}
                    placeholder="Re-enter PIN"
                  />
                </div>
              </div>
              <Button
                onClick={saveVaultPin}
                disabled={saving || !newPin || !confirmPin}
                className="bg-brand-success hover:bg-brand-success/90 text-white gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Save Vault PIN
              </Button>
            </Card>
          </motion.div>
        )}

        {/* LOADING SCREEN */}
        {activeTab === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand-accent" /> Loading Effect
              </CardTitle>

              <div className="space-y-2">
                <label className={labelClass}>Effect Style</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['default', 'pulse', 'scan', 'custom'] as const).map(effect => (
                    <button
                      key={effect}
                      onClick={() => setLoadingData(p => ({ ...p, effect }))}
                      className={`p-4 rounded-xl border text-center transition-all ${loadingData.effect === effect
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                        : 'border-brand-border dark:border-white/5 text-slate-500 hover:border-brand-accent/40'}`}
                    >
                      <p className="font-black text-[10px] uppercase tracking-widest">{effect}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Custom Logo URL</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={loadingData.logoUrl}
                    onChange={e => setLoadingData(p => ({ ...p, logoUrl: e.target.value }))}
                    className={inputClass + ' pl-10'}
                    placeholder="https://... (leave blank for default DT logo)"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Recommended: square PNG/SVG, min 200×200px.</p>
              </div>
            </Card>

            {loadingData.effect === 'custom' && (
              <Card className="space-y-6">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-success" /> Custom HTML / CSS Design
                </CardTitle>
                <p className="text-[11px] text-slate-400 leading-relaxed">Paste your full loading screen design here. HTML renders inside a centered container. CSS is injected into the page head.</p>
                <div className="space-y-2">
                  <label className={labelClass}>HTML</label>
                  <textarea
                    value={loadingData.customHTML}
                    onChange={e => setLoadingData(p => ({ ...p, customHTML: e.target.value }))}
                    className={textareaClass}
                    rows={8}
                    placeholder={'<div class="my-loader">\n  <p>Loading...</p>\n</div>'}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>CSS</label>
                  <textarea
                    value={loadingData.customCSS}
                    onChange={e => setLoadingData(p => ({ ...p, customCSS: e.target.value }))}
                    className={textareaClass}
                    rows={6}
                    placeholder={'.my-loader { color: white; font-size: 24px; }'}
                  />
                </div>
              </Card>
            )}

            <Button onClick={saveLoading} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Loading Settings
            </Button>
          </motion.div>
        )}

        {/* EMAIL SETTINGS */}
        {activeTab === 'email' && (
          <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-accent" /> Platform SMTP — Support Mailer
              </CardTitle>
              <p className="text-[11px] text-slate-400 leading-relaxed">Configure the platform-wide email credentials used by the Admin Mailer and all auto-trigger emails. These settings are stored securely in Firestore and never exposed to users.</p>
              <SmtpSettingsPanel />
            </Card>
          </motion.div>
        )}

        {/* BOT SETTINGS */}
        {activeTab === 'bot' && (
          <motion.div key="bot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Settings className="w-4 h-4 text-brand-success" /> Global Bot Settings
              </CardTitle>
              <p className="text-[11px] text-slate-400 leading-relaxed">Configure global bot subscription tiers and enable/disable bot services for all users. Individual users configure their own bot tokens in Bot Service.</p>
              <BotSettingsPanel />
            </Card>
          </motion.div>
        )}

        {/* SUBSCRIPTION PRICING */}
        {activeTab === 'subscriptions' && (
          <motion.div key="subscriptions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-success" /> Subscription Pricing
              </CardTitle>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Set the monthly prices displayed on the landing page and user subscription page. Prices are stored in Firestore and applied globally.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Basic ($/mo)</label>
                  <input
                    type="number"
                    min={0}
                    value={subPricing.emailBasicPrice}
                    onChange={e => setSubPricing(p => ({ ...p, emailBasicPrice: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                    placeholder="9"
                  />
                  <p className="text-[10px] text-slate-400">Starter email hosting plan</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Pro ($/mo)</label>
                  <input
                    type="number"
                    min={0}
                    value={subPricing.emailProPrice}
                    onChange={e => setSubPricing(p => ({ ...p, emailProPrice: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                    placeholder="29"
                  />
                  <p className="text-[10px] text-slate-400">Professional email hosting plan</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telegram Bot ($/mo)</label>
                  <input
                    type="number"
                    min={0}
                    value={subPricing.botPrice}
                    onChange={e => setSubPricing(p => ({ ...p, botPrice: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                    placeholder="19"
                  />
                  <p className="text-[10px] text-slate-400">Telegram bot automation plan</p>
                </div>
              </div>
              <Button onClick={saveSubscriptions} disabled={savingSubs} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
                {savingSubs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Pricing
              </Button>
            </Card>
          </motion.div>
        )}

        {/* CLOUDINARY */}
        {activeTab === 'cloudinary' && (
          <motion.div key="cloudinary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-brand-accent" /> Cloudinary Configuration
                </CardTitle>
                {cloudinaryStatus !== 'idle' && (
                  <StatusBadge
                    ok={cloudinaryStatus === 'ok'}
                    label={cloudinaryStatus === 'ok' ? 'Connected' : cloudinaryStatus === 'checking' ? 'Checking...' : 'Not Connected'}
                  />
                )}
              </div>

              <div className="p-4 bg-amber-950/10 border border-amber-900/20 rounded-xl">
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">Important — After Saving</p>
                <p className="text-[11px] text-slate-400">Once you save and verify the connection here, you can remove the Cloudinary keys from your <code className="text-brand-accent">.env</code> file. The platform reads Firestore first.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>Cloud Name</label>
                  <input
                    type="text"
                    value={cloudinaryData.cloudName}
                    onChange={e => setCloudinaryData(p => ({ ...p, cloudName: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. dbqyo1drz"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Upload Preset</label>
                  <input
                    type="text"
                    value={cloudinaryData.uploadPreset}
                    onChange={e => setCloudinaryData(p => ({ ...p, uploadPreset: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. my_preset"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>API Key</label>
                  <input
                    type="text"
                    value={cloudinaryData.apiKey}
                    onChange={e => setCloudinaryData(p => ({ ...p, apiKey: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. 123456789012345"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={saveCloudinary} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Cloudinary Settings
                </Button>
                <Button
                  onClick={testCloudinary}
                  disabled={cloudinaryStatus === 'checking'}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 gap-2"
                >
                  {cloudinaryStatus === 'checking'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCw className="w-4 h-4" />}
                  Test Connection
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
        {/* BRANDING */}
        {activeTab === 'branding' && (
          <motion.div key="branding" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <BrandingPanel />
          </motion.div>
        )}

        {/* ADS */}
        {activeTab === 'ads' && (
          <motion.div key="ads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <AdsPanel />
          </motion.div>
        )}

        {/* PAYMENT METHODS */}
        {activeTab === 'payments' && (
          <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <PaymentMethodsPanel />
          </motion.div>
        )}

        {/* PLATFORM BOT */}
        {activeTab === 'platformBot' && (
          <motion.div key="platformBot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-accent" /> Platform Notification Bot
              </CardTitle>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Configure a Telegram bot that receives platform-wide notifications (new signups, deposits, orders, issues). This is separate from user bot subscriptions.
              </p>
              <PlatformBotPanel />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
