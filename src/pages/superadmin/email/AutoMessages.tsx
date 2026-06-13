import { useState, useEffect } from 'react';
import { Save, Loader2, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { db, doc, setDoc, getDoc, serverTimestamp } from '../../../firebase';
import { DEFAULT_AUTO_MESSAGES, AutoMessages, AutoMessageEvent } from '../../../lib/emailService';

const EVENT_LABELS: Record<keyof AutoMessages, string> = {
  welcome: 'Welcome (New User Signup)',
  projectStatusChanged: 'Project Status Changed',
  projectCompleted: 'Project Completed',
  subscriptionActivated: 'Subscription Activated',
  subscriptionExpiring: 'Subscription Expiring (3 Days)',
  paymentConfirmed: 'Payment / Receipt Confirmed',
  couponGranted: 'Coupon Granted to User',
  referralMilestone: 'Referral Milestone Reached',
};

const TOKENS = ['$user', '$subscription', '$amount', '$project', '$date', '$coupon'];
const SLOT_OPTIONS = [
  { value: 'support', label: 'Support' },
  { value: 'help', label: 'Help' },
  { value: 'noreply', label: 'No-Reply' },
];

export default function AutoMessages() {
  const [messages, setMessages] = useState<AutoMessages>({ ...DEFAULT_AUTO_MESSAGES });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'auto_messages')).then(snap => {
      if (snap.exists()) setMessages({ ...DEFAULT_AUTO_MESSAGES, ...snap.data() } as AutoMessages);
    });
  }, []);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function save() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'auto_messages'), { ...messages, updatedAt: serverTimestamp() }, { merge: true });
      showMsg('Auto messages saved');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  function upd(key: keyof AutoMessages, field: keyof AutoMessageEvent, val: any) {
    setMessages(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl bg-brand-success text-white text-[11px] font-black uppercase tracking-widest shadow-2xl">{toast}</div>}

      <Card className="space-y-2">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Variable Tokens
        </CardTitle>
        <p className="text-[11px] text-slate-400">Use these tokens in subject and body — they are replaced automatically when the message fires.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {TOKENS.map(t => <span key={t} className="px-2.5 py-1 bg-brand-accent/10 text-brand-accent text-[10px] font-black rounded-lg font-mono">{t}</span>)}
        </div>
      </Card>

      <div className="space-y-4">
        {(Object.keys(EVENT_LABELS) as (keyof AutoMessages)[]).map(key => {
          const event = messages[key];
          return (
            <Card key={key} className="space-y-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm uppercase italic tracking-tighter">{EVENT_LABELS[key]}</CardTitle>
                <button onClick={() => upd(key, 'enabled', !event.enabled)} className="text-brand-success">
                  {event.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>

              {event.enabled && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className={labelClass}>Subject</label>
                    <input type="text" value={event.subject} onChange={e => upd(key, 'subject', e.target.value)} className={inputClass} placeholder="Email subject line" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Template Slot</label>
                    <select value={event.templateSlot} onChange={e => upd(key, 'templateSlot', e.target.value)} className={inputClass}>
                      {SLOT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className={labelClass}>Body Message</label>
                    <textarea value={event.body} onChange={e => upd(key, 'body', e.target.value)} className={inputClass + ' resize-none'} rows={3} placeholder="Message body with $user tokens..." />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button onClick={save} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save All Auto Messages
      </Button>
    </div>
  );
}
