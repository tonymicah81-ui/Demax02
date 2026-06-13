import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save, Loader2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDocs, query, orderBy } from '../../firebase';
import { useAuth } from '../../AuthContext';
import { cn } from '../../utils/cn';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  helpful: number;
  notHelpful: number;
  views: number;
  createdAt: any;
}

const BLANK = { title: '', content: '', category: 'General', published: false };

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(['General', 'Getting Started', 'Billing', 'Projects', 'Email Service', 'Troubleshooting']);
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'kb_articles'), orderBy('createdAt', 'desc')), snap => {
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Article[]);
    });
    return () => unsub();
  }, []);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function save() {
    if (!form.title || !form.content) return showMsg('Title and content required');
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, 'kb_articles', editId), { ...form, updatedAt: serverTimestamp() });
        setEditId(null);
      } else {
        await addDoc(collection(db, 'kb_articles'), {
          ...form, helpful: 0, notHelpful: 0, views: 0,
          createdBy: user?.uid || '', createdAt: serverTimestamp(),
        });
      }
      setForm({ ...BLANK });
      showMsg(editId ? 'Article updated' : 'Article created');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  function startEdit(a: Article) {
    setForm({ title: a.title, content: a.content, category: a.category, published: a.published });
    setEditId(a.id);
    window.scrollTo(0, 0);
  }

  async function togglePublish(a: Article) {
    await updateDoc(doc(db, 'kb_articles', a.id), { published: !a.published, updatedAt: serverTimestamp() });
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article?')) return;
    await deleteDoc(doc(db, 'kb_articles', id));
    showMsg('Article deleted');
  }

  const filtered = articles.filter(a => filter === 'all' || a.category === filter);
  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-8">
      {toast && <div className="fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl bg-brand-success text-white text-[11px] font-black uppercase tracking-widest shadow-2xl">{toast}</div>}

      <div className="pb-6 border-b border-brand-border dark:border-white/5">
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Knowledge Base</h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">Manage Help Articles // Admin Control</p>
      </div>

      <Card className="space-y-6">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
          {editId ? <Edit2 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-brand-success" />}
          {editId ? 'Edit Article' : 'New Article'}
        </CardTitle>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2"><label className={labelClass}>Title</label><input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Article title..." /></div>
          <div className="space-y-2"><label className={labelClass}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
            <input type="checkbox" id="pub" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} className="w-4 h-4 accent-brand-accent" />
            <label htmlFor="pub" className="text-sm font-bold text-brand-text-bold dark:text-white">Published (visible to users)</label>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>Content (Markdown supported)</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className={inputClass + ' resize-none'} rows={10} placeholder="Write the article content here..." />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={save} disabled={saving} className="bg-brand-accent text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editId ? 'Update Article' : 'Create Article'}
          </Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ ...BLANK }); }}>Cancel Edit</Button>}
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">Articles ({filtered.length})</h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', filter === 'all' ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>All</button>
            {categories.map(c => <button key={c} onClick={() => setFilter(c)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', filter === c ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>{c}</button>)}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center opacity-30"><BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" /><p className="font-black uppercase tracking-widest text-sm">No Articles</p></div>
        ) : filtered.map(a => (
          <Card key={a.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-brand-text-bold dark:text-white truncate">{a.title}</p>
                  <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0", a.published ? 'bg-brand-success/10 text-brand-success' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>{a.published ? 'Published' : 'Draft'}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">{a.category} · {a.views || 0} views · {a.helpful || 0} helpful · {a.notHelpful || 0} not helpful</p>
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{a.content.slice(0, 150)}...</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => togglePublish(a)} className={cn("p-2 rounded-lg transition-colors", a.published ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-brand-success/10 text-brand-success')}>{a.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                <button onClick={() => startEdit(a)} className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteArticle(a.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-400 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
