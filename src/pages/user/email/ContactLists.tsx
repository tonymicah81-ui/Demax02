import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, Loader2, Mail, X } from 'lucide-react';
import { Card, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../AuthContext';
import { getUserContactLists, createContactList } from '../../../lib/userEmailService';
import { db, doc, updateDoc, deleteDoc, serverTimestamp } from '../../../firebase';
import { useOutletContext } from 'react-router-dom';

export default function ContactLists() {
  const { user } = useAuth();
  const { isPro } = useOutletContext<{ sub: any; isPro: boolean }>();
  const [lists, setLists] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmails, setNewEmails] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addEmailInput, setAddEmailInput] = useState('');

  useEffect(() => {
    if (!user) return;
    getUserContactLists(user.uid).then(data => { setLists(data); setLoading(false); });
  }, [user]);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function createList() {
    if (!user || !newName.trim()) return showMsg('List name required');
    const emails = newEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e.includes('@'));
    if (emails.length === 0) return showMsg('Add at least one valid email');
    setCreating(true);
    try {
      const id = await createContactList(user.uid, newName.trim(), emails);
      setLists(p => [{ id, userId: user.uid, name: newName.trim(), emails, createdAt: new Date() }, ...p]);
      setNewName('');
      setNewEmails('');
      showMsg(`List created with ${emails.length} contacts`);
    } catch { showMsg('Failed to create list'); }
    finally { setCreating(false); }
  }

  async function addEmailToList(listId: string, emails: string[]) {
    if (!addEmailInput.trim()) return;
    const newOnes = addEmailInput.split(/[\n,]+/).map(e => e.trim()).filter(e => e.includes('@'));
    const updated = [...new Set([...emails, ...newOnes])];
    await updateDoc(doc(db, 'email_contact_lists', listId), { emails: updated, updatedAt: serverTimestamp() });
    setLists(p => p.map(l => l.id === listId ? { ...l, emails: updated } : l));
    setAddEmailInput('');
    showMsg(`Added ${newOnes.length} email(s)`);
  }

  async function removeEmailFromList(listId: string, emails: string[], emailToRemove: string) {
    const updated = emails.filter(e => e !== emailToRemove);
    await updateDoc(doc(db, 'email_contact_lists', listId), { emails: updated, updatedAt: serverTimestamp() });
    setLists(p => p.map(l => l.id === listId ? { ...l, emails: updated } : l));
  }

  async function deleteList(id: string) {
    if (!confirm('Delete this contact list?')) return;
    await deleteDoc(doc(db, 'email_contact_lists', id));
    setLists(p => p.filter(l => l.id !== id));
    showMsg('List deleted');
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";

  if (!isPro) return (
    <div className="py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto"><Users className="w-8 h-8 text-amber-500" /></div>
      <h3 className="text-xl font-black uppercase tracking-tighter italic text-brand-text-bold dark:text-white">Pro Feature</h3>
      <p className="text-slate-400 text-sm">Contact lists are available on the Pro plan. Upgrade to manage bulk contact groups.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl bg-brand-success text-white text-[11px] font-black uppercase tracking-widest shadow-2xl">{toast}</div>}

      <Card className="space-y-6">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Plus className="w-4 h-4 text-brand-success" /> Create Contact List</CardTitle>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">List Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} className={inputClass} placeholder="e.g. Newsletter, Customers Jan 2026" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Addresses</label>
            <textarea value={newEmails} onChange={e => setNewEmails(e.target.value)} className={inputClass + ' resize-none'} rows={4} placeholder="Paste emails here — one per line or comma-separated&#10;user1@example.com&#10;user2@example.com" />
            <p className="text-[10px] text-slate-400">Separate with commas or new lines. Duplicates removed automatically.</p>
          </div>
        </div>
        <Button onClick={createList} disabled={creating} className="bg-brand-success text-white gap-2">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create List
        </Button>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">Your Lists ({lists.length})</h2>
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-accent mx-auto" /></div>
        ) : lists.length === 0 ? (
          <div className="py-20 text-center opacity-30"><Users className="w-16 h-16 mx-auto mb-4 text-slate-400" /><p className="font-black uppercase tracking-widest text-sm">No Lists Yet</p></div>
        ) : lists.map(list => (
          <Card key={list.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === list.id ? null : list.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center"><Users className="w-5 h-5 text-brand-accent" /></div>
                <div>
                  <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">{list.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{list.emails?.length || 0} contacts</p>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteList(list.id); }} className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-400 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>

            {expandedId === list.id && (
              <div className="mt-4 space-y-4 pt-4 border-t border-brand-border dark:border-white/5">
                <div className="flex gap-3">
                  <input value={addEmailInput} onChange={e => setAddEmailInput(e.target.value)} className={inputClass} placeholder="Add more emails (comma-separated)..." />
                  <Button size="sm" onClick={() => addEmailToList(list.id, list.emails || [])} className="bg-brand-accent text-white shrink-0"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(list.emails || []).map((email: string) => (
                    <span key={email} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <Mail className="w-3 h-3" />{email}
                      <button onClick={() => removeEmailFromList(list.id, list.emails, email)} className="ml-1 text-red-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
