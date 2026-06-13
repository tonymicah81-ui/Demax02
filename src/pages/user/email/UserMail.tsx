import { useState, useEffect } from 'react';
import { Mail, Send, Clock, Plus, X, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { Card, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TemplateBuilder } from '../../../components/mail/TemplateBuilder';
import { useAuth } from '../../../AuthContext';
import { sendUserMail, getUserMailLogs, getUserContactLists } from '../../../lib/userEmailService';
import { useOutletContext } from 'react-router-dom';
import { cn } from '../../../utils/cn';

export default function UserMail() {
  const { user } = useAuth();
  const { sub, isPro } = useOutletContext<{ sub: any; isPro: boolean }>();
  const [to, setTo] = useState<string[]>([]);
  const [toInput, setToInput] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [fromIdx, setFromIdx] = useState(0);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const smtpConfigs = sub?.smtpConfigs || [];

  useEffect(() => {
    if (!user) return;
    getUserMailLogs(user.uid).then(setLogs);
    if (isPro) getUserContactLists(user.uid).then(setContactLists);
  }, [user, isPro]);

  function showMsg(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); }

  function addEmail() {
    const emails = toInput.split(/[\n,]+/).map(e => e.trim()).filter(e => e.includes('@'));
    setTo(p => [...new Set([...p, ...emails])]);
    setToInput('');
  }

  function loadList(list: any) {
    setTo(p => [...new Set([...p, ...(list.emails || [])])]);
  }

  async function handleSend() {
    if (!user) return;
    if (to.length === 0) return showMsg('Add at least one recipient', false);
    if (!subject.trim()) return showMsg('Subject is required', false);
    if (!html.trim()) return showMsg('Write your email content', false);
    setSending(true);
    try {
      await sendUserMail({ userId: user.uid, to, subject, html, fromConfigIndex: fromIdx });
      const newLogs = await getUserMailLogs(user.uid);
      setLogs(newLogs);
      showMsg(`Sent to ${to.length} recipient(s)`, true);
      setTo([]);
      setSubject('');
      setHtml('');
    } catch (err: any) {
      showMsg(err?.message || 'Send failed — check your SMTP settings', false);
    } finally {
      setSending(false);
    }
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.ok ? 'bg-brand-success' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-5">
            <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Mail className="w-4 h-4 text-brand-accent" /> Recipients</CardTitle>
            <div className="flex gap-3">
              <input value={toInput} onChange={e => setToInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEmail()} className={inputClass} placeholder="Add email addresses (press Enter or comma to add)" />
              <Button size="sm" onClick={addEmail} className="bg-brand-accent text-white shrink-0"><Plus className="w-4 h-4" /></Button>
            </div>
            {isPro && contactLists.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Load from Contact List</p>
                <div className="flex flex-wrap gap-2">
                  {contactLists.map(list => (
                    <button key={list.id} onClick={() => loadList(list)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent/10 text-brand-accent text-[10px] font-black rounded-xl hover:bg-brand-accent/20 transition-colors">
                      <Users className="w-3 h-3" />{list.name} ({list.emails?.length || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}
            {to.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{to.length} Recipient(s)</p>
                <div className="flex flex-wrap gap-2">
                  {to.map(email => (
                    <span key={email} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      {email}
                      <button onClick={() => setTo(p => p.filter(e => e !== email))} className="text-red-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-5">
            <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Mail className="w-4 h-4 text-brand-success" /> Compose</CardTitle>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} placeholder="Email subject line" />
            </div>
            <TemplateBuilder value={html} onChange={setHtml} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <CardTitle className="uppercase italic tracking-tighter text-sm">Send Options</CardTitle>
            {smtpConfigs.length > 1 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Send From</label>
                <select value={fromIdx} onChange={e => setFromIdx(Number(e.target.value))} className={inputClass + ' text-xs'}>
                  {smtpConfigs.map((cfg: any, i: number) => <option key={i} value={i}>{cfg.label || cfg.emailAddress}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-brand-border dark:border-white/5">
              <div><p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight">Schedule</p><p className="text-[10px] text-slate-400 mt-0.5">Send at a later time</p></div>
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
              {scheduleMode ? 'Schedule' : 'Send Now'}
            </Button>
          </Card>

          <Card className="space-y-3">
            <CardTitle className="uppercase italic tracking-tighter text-sm">Sent Log</CardTitle>
            {logs.length === 0 ? <p className="text-[10px] text-slate-400 italic py-4 text-center">No sent mail yet</p> : logs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-brand-border dark:border-white/5">
                <p className="text-[10px] font-black text-brand-text-bold dark:text-white truncate uppercase tracking-tight">{log.subject}</p>
                <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{Array.isArray(log.recipientEmails) ? log.recipientEmails.join(', ') : log.recipientEmails}</p>
                <p className="text-[9px] text-slate-400 mt-1">{log.sentAt?.toDate ? log.sentAt.toDate().toLocaleDateString() : '—'}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
