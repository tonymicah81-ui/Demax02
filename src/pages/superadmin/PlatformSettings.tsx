import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Cloud, Palette, Mail, Save, Loader2, CheckCircle2,
  XCircle, Eye, EyeOff, ToggleLeft, ToggleRight, Settings,
  Key, Code2, Image, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../AuthContext';
import {
  loadSetting, saveSetting, hashPin,
  VaultSettings, CloudinarySettings, LoadingSettings, GeneralSettings
} from '../../lib/platformSettings';
import { db, doc, updateDoc, serverTimestamp } from '../../firebase';

type Tab = 'general' | 'vault' | 'loading' | 'cloudinary';

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

  // Vault settings
  const [vaultData, setVaultData] = useState<VaultSettings>({ active: false, pinHash: '' });
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Loading settings
  const [loadingData, setLoadingData] = useState<LoadingSettings>({ effect: 'default', logoUrl: '', customHTML: '', customCSS: '' });

  // Cloudinary settings
  const [cloudinaryData, setCloudinaryData] = useState<CloudinarySettings>({ cloudName: '', uploadPreset: '', apiKey: '' });
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  // Super admin personal email
  const [personalEmail, setPersonalEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    loadSetting('general').then(setGeneralData);
    loadSetting('vault').then(setVaultData);
    loadSetting('loading').then(setLoadingData);
    loadSetting('cloudinary').then(d => {
      if (d.cloudName) {
        setCloudinaryData(d);
      } else {
        // Fallback to env variables if Firestore not set
        setCloudinaryData({
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
          uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
          apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
        });
      }
    });
    if (profile) setPersonalEmail((profile as any).personalEmail || '');
  }, [profile]);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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

  async function saveVaultToggle() {
    setSaving(true);
    try {
      await saveSetting('vault', { active: !vaultData.active, pinHash: vaultData.pinHash });
      setVaultData(prev => ({ ...prev, active: !prev.active }));
      showToast(`Vault ${!vaultData.active ? 'activated' : 'deactivated'}`, 'success');
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
      const pinHash = await hashPin(newPin);
      await saveSetting('vault', { pinHash, active: vaultData.active });
      setVaultData(prev => ({ ...prev, pinHash }));
      setNewPin('');
      setConfirmPin('');
      showToast('Vault PIN updated', 'success');
    } catch {
      showToast('Failed to update PIN', 'error');
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
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryData.cloudName}/image/upload`, {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          const blob = new Blob(['test'], { type: 'text/plain' });
          fd.append('file', blob, 'test.txt');
          fd.append('upload_preset', cloudinaryData.uploadPreset);
          return fd;
        })(),
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
              <p className="text-sm text-slate-500 dark:text-slate-400">This email receives security alerts (e.g. vault lockouts). It is never shown publicly.</p>
              <div className="grid md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className={labelClass}>Super Admin Notification Email</label>
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
                <StatusBadge ok={vaultData.active} label={vaultData.active ? 'Active' : 'Inactive'} />
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 space-y-3">
                <p className="text-sm font-bold text-brand-text-bold dark:text-white">How the Vault works</p>
                <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
                  <li>• When <strong>Active</strong>: anyone visiting /company/vault must enter the PIN before seeing the login/signup pages</li>
                  <li>• When <strong>Inactive</strong>: the vault gate is skipped and the pages are shown directly</li>
                  <li>• After <strong>5 wrong attempts</strong>, the vault locks for 15 minutes and an alert is logged</li>
                  <li>• The PIN is stored as a secure hash — never as plain text</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-brand-border dark:border-white/5">
                <div>
                  <p className="font-black text-brand-text-bold dark:text-white uppercase tracking-tight text-sm">Vault Active</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toggle to enable/disable the PIN gate</p>
                </div>
                <button
                  onClick={saveVaultToggle}
                  disabled={saving || !vaultData.pinHash}
                  className="text-brand-success disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-105"
                  title={!vaultData.pinHash ? 'Set a PIN first before activating' : ''}
                >
                  {vaultData.active
                    ? <ToggleRight className="w-10 h-10" />
                    : <ToggleLeft className="w-10 h-10 text-slate-400" />}
                </button>
              </div>

              {!vaultData.pinHash && (
                <div className="flex items-center gap-3 p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Set a PIN below before activating the vault</p>
                </div>
              )}
            </Card>

            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-accent" /> Set / Change Vault PIN
              </CardTitle>
              {vaultData.pinHash && (
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
                <p className="text-[10px] text-slate-400">Used in all effects except Custom. Recommended: square PNG/SVG, min 200×200px.</p>
              </div>
            </Card>

            {loadingData.effect === 'custom' && (
              <Card className="space-y-6">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-success" /> Custom HTML / CSS Design
                </CardTitle>
                <p className="text-[11px] text-slate-400 leading-relaxed">Paste your full loading screen design here. The HTML renders inside a centered container. CSS is injected into the page head.</p>
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

        {/* CLOUDINARY */}
        {activeTab === 'cloudinary' && (
          <motion.div key="cloudinary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <Card className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-brand-accent" /> Cloudinary Configuration
                </CardTitle>
                {cloudinaryStatus !== 'idle' && (
                  <StatusBadge ok={cloudinaryStatus === 'ok'} label={cloudinaryStatus === 'ok' ? 'Connected' : cloudinaryStatus === 'checking' ? 'Checking...' : 'Not Connected'} />
                )}
              </div>

              <div className="p-4 bg-amber-950/10 border border-amber-900/20 rounded-xl">
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">Important — After Saving</p>
                <p className="text-[11px] text-slate-400">Once you save and verify the connection here, remove the Cloudinary keys from your <code className="text-brand-accent">.env</code> file. The platform will use these Firestore-stored values instead.</p>
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
                    placeholder="e.g. 833482958867845"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={saveCloudinary} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Credentials
                </Button>
                <Button
                  onClick={testCloudinary}
                  disabled={cloudinaryStatus === 'checking'}
                  variant="outline"
                  className="gap-2 border-brand-success text-brand-success hover:bg-brand-success/10"
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
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
