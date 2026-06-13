import { useState, useEffect } from 'react';
import { BookOpen, Search, ThumbsUp, ThumbsDown, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { db, collection, query, where, onSnapshot, orderBy, doc, updateDoc, increment } from '../../firebase';
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

export default function HelpCenter() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openArticle, setOpenArticle] = useState<Article | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'kb_articles'), where('published', '==', true), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Article[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function openArticleView(article: Article) {
    setOpenArticle(article);
    try { await updateDoc(doc(db, 'kb_articles', article.id), { views: increment(1) }); } catch {}
  }

  async function vote(articleId: string, type: 'helpful' | 'notHelpful') {
    if (voted.has(articleId)) return;
    setVoted(p => new Set([...p, articleId]));
    try { await updateDoc(doc(db, 'kb_articles', articleId), { [type]: increment(1) }); } catch {}
  }

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];
  const filtered = articles.filter(a => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (openArticle) return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => setOpenArticle(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-accent transition-colors">
        ← Back to Help Center
      </button>
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">{openArticle.category}</span>
        <h1 className="text-3xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-tight">{openArticle.title}</h1>
      </div>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{openArticle.content}</div>
      </div>
      <div className="pt-6 border-t border-brand-border dark:border-white/5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Was this helpful?</p>
        <div className="flex gap-3">
          <button onClick={() => vote(openArticle.id, 'helpful')} disabled={voted.has(openArticle.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", voted.has(openArticle.id) ? 'opacity-50 cursor-not-allowed' : 'bg-brand-success/10 text-brand-success hover:bg-brand-success/20')}>
            <ThumbsUp className="w-3.5 h-3.5" /> Yes ({openArticle.helpful || 0})
          </button>
          <button onClick={() => vote(openArticle.id, 'notHelpful')} disabled={voted.has(openArticle.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", voted.has(openArticle.id) ? 'opacity-50 cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20')}>
            <ThumbsDown className="w-3.5 h-3.5" /> No ({openArticle.notHelpful || 0})
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-brand-border dark:border-white/5">
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Help Center</h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">Knowledge Base // Find Answers Fast</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white" placeholder="Search articles..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)} className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', selectedCategory === c ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white')}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand-accent mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center opacity-30"><BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-400" /><p className="font-black uppercase tracking-widest text-sm">{search ? 'No articles found' : 'No articles published yet'}</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(article => (
            <Card key={article.id} hover onClick={() => openArticleView(article)} className="cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-accent">{article.category}</span>
                  <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic mt-1 mb-2">{article.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{article.content.slice(0, 120)}...</p>
                  <div className="flex gap-3 mt-3 text-[9px] font-mono text-slate-400">
                    <span>{article.views || 0} views</span>
                    <span className="text-brand-success">{article.helpful || 0} helpful</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
