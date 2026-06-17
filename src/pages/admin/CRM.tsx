import { useState, useEffect } from 'react';
import { Users, Plus, Save, Loader2, Trash2, Edit2, Phone, Mail, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from '../../firebase';
import { useAuth } from '../../AuthContext';
import { cn } from '../../utils/cn';

type LeadStatus = 'cold' | 'contacted' | 'proposal' | 'won' | 'lost';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  notes: string;
  followUpDate: string;
  assignedTo: string;
  createdAt: any;
  updatedAt: any;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  cold: { label: 'Cold', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  contacted: { label: 'Contacted', color: 'bg-brand-accent/10 text-brand-accent' },
  proposal: { label: 'Proposal Sent', color: 'bg-amber-500/10 text-amber-500' },
  won: { label: 'Won', color: 'bg-brand-success/10 text-brand-success' },
  lost: { label: 'Lost', color: 'bg-red-500/10 text-red-500' },
};

const SOURCES = ['Referral', 'Social Media', 'Direct', 'Cold Outreach', 'Ad Campaign', 'Other'];
const BLANK: Partial<Lead> = { name: '', email: '', phone: '', source: 'Referral', status: 'cold', notes: '', followUpDate: '', assignedTo: '' };

export default function CRM() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState<Partial<Lead>>({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | LeadStatus>('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'leads'), orderBy('createdAt', 'desc')), snap => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Lead[]);
    });
    return () => unsub();
  }, []);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function save() {
    if (!form.name || !form.email) return showMsg('Name and email required');
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, 'leads', editId), { ...form, updatedAt: serverTimestamp() });
        setEditId(null);
      } else {
        await addDoc(collection(db, 'leads'), {
          ...form, assignedTo: form.assignedTo || user?.uid || '',
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      }
      setForm({ ...BLANK });
      setShowForm(false);
      showMsg(editId ? 'Lead updated' : 'Lead added');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: LeadStatus) {
    await updateDoc(doc(db, 'leads', id), { status, updatedAt: serverTimestamp() });
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return;
    await deleteDoc(doc(db, 'leads', id));
    showMsg('Lead deleted');
  }

  function startEdit(l: Lead) {
    setForm({ name: l.name, email: l.email, phone: l.phone, source: l.source, status: l.status, notes: l.notes, followUpDate: l.followUpDate, assignedTo: l.assignedTo });
    setEditId(l.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  }

  const today = new Date().toISOString().split('T')[0];
  const filtered = leads.filter(l => filterStatus === 'all' || l.status === filterStatus);
  const todayFollowUps = leads.filter(l => l.followUpDate === today && l.status !== 'won' && l.status !== 'lost');

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-8">
      {toast && <div className="fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl bg-brand-success text-white text-[11px] font-black uppercase tracking-widest shadow-2xl">{toast}</div>}

      <div className="pb-6 border-b border-brand-border dark:border-white/5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">CRM — Leads</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">Client pipeline management</p>
        </div>
        <Button onClick={() => { setShowForm(p => !p); if (editId) { setEditId(null); setForm({ ...BLANK }); } }} className="gap-2 bg-brand-accent text-white">
          <Plus className="w-4 h-4" /> {showForm && !editId ? 'Cancel' : 'Add Lead'}
        </Button>
      </div>

      {todayFollowUps.length > 0 && (
        <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-2xl flex gap-3">
          <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">Follow-up Today ({todayFollowUps.length})</p>
            <div className="flex flex-wrap gap-2">
              {todayFollowUps.map(l => <span key={l.id} className="text-[10px] text-amber-300 font-bold">{l.name}</span>)}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <Card className="space-y-6">
          <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
            {editId ? <Edit2 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-brand-success" />}
            {editId ? 'Edit Lead' : 'New Lead'}
          </CardTitle>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2"><label className={labelClass}>Name</label><input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Client name" /></div>
            <div className="space-y-2"><label className={labelClass}>Email</label><input type="email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="client@email.com" /></div>
            <div className="space-y-2"><label className={labelClass}>Phone</label><input value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} placeholder="+1 234 567 8900" /></div>
            <div className="space-y-2"><label className={labelClass}>Source</label><select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className={inputClass}>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="space-y-2"><label className={labelClass}>Status</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as LeadStatus }))} className={inputClass}>{(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}</select></div>
            <div className="space-y-2"><label className={labelClass}>Follow-up Date</label><input type="date" value={form.followUpDate || ''} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} className={inputClass} /></div>
            <div className="space-y-2 md:col-span-3"><label className={labelClass}>Notes</label><textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={inputClass + ' resize-none'} rows={3} placeholder="Notes about this lead..." /></div>
          </div>
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving} className="bg-brand-accent text-white gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? 'Update Lead' : 'Add Lead'}
            </Button>
            {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ ...BLANK }); setShowForm(false); }}>Cancel</Button>}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {([['all', 'All', leads.length], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label, leads.filter(l => l.status === k).length])] as any[]).map(([k, label, count]) => (
            <button key={k} onClick={() => setFilterStatus(k as any)} className={cn('px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center', filterStatus === k ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white')}>
              {label} <span className="font-mono">({count})</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center opacity-30"><Users className="w-16 h-16 mx-auto mb-4 text-slate-400" /><p className="font-black uppercase tracking-widest text-sm">No Leads</p></div>
        ) : filtered.map(lead => (
          <Card key={lead.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">{lead.name}</p>
                  <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", STATUS_CONFIG[lead.status].color)}>{STATUS_CONFIG[lead.status].label}</span>
                  {lead.followUpDate === today && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">Follow Up Today</span>}
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  {lead.followUpDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lead.followUpDate}</span>}
                  <span>Source: {lead.source}</span>
                </div>
                {lead.notes && <p className="text-[11px] text-slate-500 line-clamp-2">{lead.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value as LeadStatus)} className="bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase focus:outline-none">
                  {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
                <button onClick={() => startEdit(lead)} className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteLead(lead.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-400 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
