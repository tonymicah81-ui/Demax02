import { useState, useEffect } from 'react';
import { Save, Loader2, FileText } from 'lucide-react';
import { Card, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TemplateBuilder } from '../../../components/mail/TemplateBuilder';
import { PreviewPanel } from '../../../components/mail/PreviewPanel';
import { db, doc, setDoc, getDoc, serverTimestamp } from '../../../firebase';

type SlotKey = 'support' | 'help' | 'noreply';

interface Slot {
  html: string;
  subject: string;
}

const SLOT_LABELS: Record<SlotKey, string> = {
  support: 'Support',
  help: 'Help',
  noreply: 'No-Reply / Auto',
};

const DEFAULT_SLOTS: Record<SlotKey, Slot> = {
  support: { html: '', subject: 'Support Request' },
  help: { html: '', subject: 'Help Center' },
  noreply: { html: '', subject: 'Platform Notification' },
};

export default function EmailTemplates() {
  const [activeSlot, setActiveSlot] = useState<SlotKey>('support');
  const [slots, setSlots] = useState<Record<SlotKey, Slot>>(DEFAULT_SLOTS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'email_templates')).then(snap => {
      if (snap.exists()) setSlots({ ...DEFAULT_SLOTS, ...snap.data() } as Record<SlotKey, Slot>);
    });
  }, []);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function save() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'email_templates'), { ...slots, updatedAt: serverTimestamp() }, { merge: true });
      showMsg('Templates saved');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  const slot = slots[activeSlot];
  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl bg-brand-success text-white text-[11px] font-black uppercase tracking-widest shadow-2xl">{toast}</div>}

      <Card className="space-y-6">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-accent" /> Email Template Slots
        </CardTitle>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Three shared template slots used by the platform mailer and auto-messages. Variables: <code className="text-brand-accent">{'{{username}} {{email}} {{amount}} {{subscription}} {{project}} {{date}}'}</code>
        </p>

        <div className="flex gap-2">
          {(Object.keys(SLOT_LABELS) as SlotKey[]).map(key => (
            <button
              key={key}
              onClick={() => setActiveSlot(key)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSlot === key ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'}`}
            >
              {SLOT_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default Subject Line</label>
          <input
            type="text"
            value={slot.subject}
            onChange={e => setSlots(p => ({ ...p, [activeSlot]: { ...p[activeSlot], subject: e.target.value } }))}
            className={inputClass}
            placeholder="Subject for this template"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Template HTML</label>
          <TemplateBuilder
            value={slot.html}
            onChange={html => setSlots(p => ({ ...p, [activeSlot]: { ...p[activeSlot], html } }))}
          />
        </div>

        <Button onClick={save} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Templates
        </Button>
      </Card>
    </div>
  );
}
