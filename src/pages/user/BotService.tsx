import { useState, useEffect } from 'react';
import { Bot, Save, Loader2, Wifi, WifiOff, Lock, ExternalLink } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../AuthContext';
import { getBotSubscription, saveBotSubscription, testTelegramToken, BotSubscription } from '../../lib/botService';
import { useNavigate } from 'react-router-dom';

export default function BotService() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState<BotSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [greeting, setGreeting] = useState('');
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) return;
    getBotSubscription(user.uid).then(data => {
      setSub(data);
      if (data) {
        setToken(data.token || '');
        setChatId(data.chatId || '');
        setGreeting(data.greetingMessage || '');
        setConnected(data.status === 'active');
      }
      setLoading(false);
    });
  }, [user]);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function testToken() {
    if (!token) return showMsg('Enter your bot token first');
    setTesting(true);
    const ok = await testTelegramToken(token);
    setConnected(ok);
    showMsg(ok ? 'Bot token verified!' : 'Invalid token — check your BotFather setup');
    setTesting(false);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await saveBotSubscription(user.uid, {
        botType: 'telegram', token, chatId, greetingMessage: greeting,
        status: connected ? 'active' : 'pending',
        expiresAt: sub?.expiresAt || null,
        tier: sub?.tier || 'basic',
      });
      showMsg('Bot configuration saved');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Bot Service...</p>
    </div>
  );

  if (!sub || sub.status === 'inactive') return (
    <div className="h-96 flex flex-col items-center justify-center space-y-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Lock className="w-10 h-10 text-slate-400" /></div>
      <div>
        <h2 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Bot Service Not Active</h2>
        <p className="text-slate-400 text-sm mt-2">Subscribe to a bot plan to configure your Telegram bot.</p>
      </div>
      <button onClick={() => navigate('/subscription')} className="px-8 py-3 bg-brand-accent text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-brand-accent/90 transition-colors">View Plans</button>
    </div>
  );

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-8">
      {toast && <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.includes('nvalid') || toast.includes('ailed') ? 'bg-red-600' : 'bg-brand-success'}`}>{toast}</div>}

      <div className="pb-6 border-b border-brand-border dark:border-white/5">
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Bot Service</h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">Telegram Bot Configuration</p>
      </div>

      <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest w-fit ${connected ? 'bg-brand-success/10 text-brand-success' : 'bg-amber-500/10 text-amber-500'}`}>
        {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {connected ? 'Bot Connected & Active' : 'Bot Pending Configuration'}
      </div>

      <Card className="space-y-6">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Bot className="w-4 h-4 text-brand-accent" /> Telegram Bot Setup</CardTitle>
        <div className="p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-xl">
          <p className="text-[11px] text-brand-accent font-bold leading-relaxed">
            Create your bot via <strong>@BotFather</strong> on Telegram. Send /newbot, follow the steps, and paste your bot token below. Your support team can help set this up — contact them via chat.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2"><label className={labelClass}>Bot Token (from BotFather)</label><input type="password" value={token} onChange={e => setToken(e.target.value)} className={inputClass} placeholder="1234567890:AAGxxxxxxxxxxxxxxx" /></div>
          <div className="space-y-2"><label className={labelClass}>Chat ID (for notifications)</label><input value={chatId} onChange={e => setChatId(e.target.value)} className={inputClass} placeholder="-100123456789" /></div>
          <div className="space-y-2 md:col-span-2"><label className={labelClass}>Greeting Message</label><textarea value={greeting} onChange={e => setGreeting(e.target.value)} className={inputClass + ' resize-none'} rows={3} placeholder="Hello! I'm your support bot. How can I help you today?" /></div>
        </div>

        <div className="flex gap-3">
          <Button onClick={testToken} disabled={testing} variant="outline" className="gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Token
          </Button>
          <Button onClick={save} disabled={saving} className="bg-brand-accent text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Config
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle className="uppercase italic tracking-tighter text-sm flex items-center gap-2"><Bot className="w-4 h-4 text-slate-400" /> What's Coming</CardTitle>
        <p className="text-[11px] text-slate-400 leading-relaxed">Your bot configuration is saved and ready. Once the backend is wired in, your bot will be able to:</p>
        {['Send you project update notifications', 'Receive and route customer messages', 'Send subscription reminders automatically', 'Execute custom commands you configure'].map(item => (
          <div key={item} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-brand-border dark:border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300">{item}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
