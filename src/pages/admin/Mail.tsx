import { useState, useEffect } from 'react';
import { Mail, Send, Clock, Loader2, Users, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TemplateBuilder } from '../../components/mail/TemplateBuilder';
import { db, collection, query, getDocs, onSnapshot, orderBy, limit, serverTimestamp, addDoc } from '../../firebase';
import { useAuth } from '../../AuthContext';
import { sendMail, logScheduledMail } from '../../lib/emailService';
import { cn } from '../../utils/cn';

type RecipientMode = 'all' | 'specific' | 'manual';

interface SentLog {
  id: string;
  recipientEmail: string;
  subject: string;
  sentAt: any;
  status: string;
}

export default function AdminMail() {
  const { user } = useAuth();
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('specific');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<SentLog[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const q = query(collection(db, 'mail_logs'), orderBy('sentAt', 'desc'), limit(30));
    const unsub = onSnapshot(q, snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SentLog))));
    return () => unsub();
  }, []);

  function showMsg(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); }

  function getRecipients(): { email: string; userId?: string }[] {
    if (recipientMode === 'all') return users.map(u => ({ email: u.email, userId: u.id }));
    if (recipientMode === 'specific') {
      const u = users.find(u => u.id === selectedUserId);
      return u ? [{ email: u.email, userId: u.id }] : [];
    }
    if (recipientMode === 'manual' && manualEmail.trim()) {
      return manualEmail.split(',').map(e => ({ email: e.trim() })).filter(e => e.email);
    }
    return [];
  }

  async function handleSend() {
    const recipients = getRecipients();
    if (!recipients.length) return showMsg('No recipients selected', false);
    if (!subject.trim()) return showMsg('Subject is required', false);
    if (!html.trim()) return showMsg('Email content is required', false);

    setSending(true);
    try {
      if (scheduleMode && scheduleDate && scheduleTime) {
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
        await logScheduledMail({ senderId: user!.uid, recipients: recipients.map(r => r.email), subject, html, scheduledAt });
        showMsg(`Scheduled for ${scheduledAt.toLocaleString()}`, true);
      } else {
        for (const r of recipients) {
          await sendMail({ to: r.email, subject, html, smtpType: 'support', senderId: user?.uid, recipientUserId: r.userId });
        }
        showMsg(`Sent to ${recipients.length} recipient(s)`, true);
      }
      setSubject('');
      setHtml('');
    } catch (err) {
      showMsg('Send failed — check SMTP settings in Platform Settings', false);
    } finally {
      setSending(false);
    }
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.ok ? 'bg-brand-success' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="pb-6 border-b border-brand-border dark:border-white/5">
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Platform Mailer</h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">Send emails to users // Admin Control</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-6">
            <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Users className="w-4 h-4 text-brand-accent" /> Recipients</CardTitle>
            <div className="flex gap-2">
              {(['specific', 'all', 'manual'] as RecipientMode[]).map(m => (
                <button key={m} onClick={() => setRecipientMode(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${recipientMode === m ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'}`}>
                  {m === 'specific' ? 'Specific User' : m === 'all' ? `All Users (${users.length})` : 'Manual Email'}
                </button>
              ))}
            </div>
            {recipientMode === 'specific' && (
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className={inputClass}>
                <option value="">Select a user...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username} — {u.email}</option>)}
              </select>
            )}
            {recipientMode === 'manual' && (
              <div className="space-y-1">
                <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} className={inputClass} placeholder="email1@example.com, email2@example.com" />
                <p className="text-[10px] text-slate-400">Separate multiple emails with commas</p>
              </div>
            )}
            {recipientMode === 'all' && (
              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-amber-400 text-[10px] font-bold">This will send to all {users.length} registered users.</p>
              </div>
            )}
          </Card>

          <Card className="space-y-6">
            <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Mail className="w-4 h-4 text-brand-success" /> Compose</CardTitle>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} placeholder="Email subject line" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Content</label>
              <TemplateBuilder value={html} onChange={setHtml} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <CardTitle className="uppercase italic tracking-tighter text-sm">Send Options</CardTitle>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-brand-border dark:border-white/5">
              <div>
                <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight">Schedule</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Send at a future date/time</p>
              </div>
              <input type="checkbox" checked={scheduleMode} onChange={e => setScheduleMode(e.target.checked)} className="w-5 h-5 accent-brand-accent cursor-pointer" />
            </div>
            {scheduleMode && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</label><input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={inputClass + ' text-xs'} /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</label><input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className={inputClass + ' text-xs'} /></div>
              </div>
            )}
            <Button onClick={handleSend} disabled={sending} className="w-full gap-2 bg-brand-accent text-white">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : scheduleMode ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {scheduleMode ? 'Schedule Send' : 'Send Now'}
            </Button>
          </Card>

          <Card className="space-y-3">
            <CardTitle className="uppercase italic tracking-tighter text-sm">Sent Log</CardTitle>
            {logs.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic py-4 text-center">No sent mail yet</p>
            ) : logs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-brand-border dark:border-white/5">
                <p className="text-[10px] font-black text-brand-text-bold dark:text-white truncate uppercase tracking-tight">{log.subject}</p>
                <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{log.recipientEmail}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[9px] text-slate-400">{log.sentAt?.toDate ? log.sentAt.toDate().toLocaleDateString() : '—'}</p>
                  <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full", log.status === 'sent' ? 'bg-brand-success/10 text-brand-success' : 'bg-amber-500/10 text-amber-500')}>{log.status}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
