import { useState, useEffect } from 'react';
import { Save, Loader2, Bot, Wifi, WifiOff } from 'lucide-react';
import { Card, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { getBotPlatformConfig, testTelegramToken } from '../../../lib/botService';
import { db, doc, setDoc, serverTimestamp } from '../../../firebase';

export default function BotSettings() {
  const [token, setToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getBotPlatformConfig().then(cfg => {
      setToken(cfg.token || '');
      setWebhookUrl(cfg.webhookUrl || '');
      setConnected(cfg.connected || false);
    });
  }, []);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function testToken() {
    if (!token) return showMsg('Enter a bot token first');
    setTesting(true);
    const ok = await testTelegramToken(token);
    setConnected(ok);
    showMsg(ok ? 'Telegram bot connected!' : 'Invalid token — check your BotFather token');
    setTesting(false);
  }

  async function save() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'bot_config'), {
        token, webhookUrl, connected,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      showMsg('Bot config saved');
    } catch { showMsg('Save failed'); }
    finally { setSaving(false); }
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.includes('nvalid') || toast.includes('failed') ? 'bg-red-600' : 'bg-brand-success'}`}>{toast}</div>}

      <Card className="space-y-6">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
          <Bot className="w-4 h-4 text-brand-accent" /> Platform Telegram Bot
        </CardTitle>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Configure the platform's Telegram bot for system notifications. Create a bot via BotFather on Telegram to get the token.
          The webhook will be connected to the backend when infrastructure is ready.
        </p>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${connected ? 'bg-brand-success/10 text-brand-success' : 'bg-red-950/20 text-red-400'}`}>
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {connected ? 'Bot Connected' : 'Not Connected'}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>Bot Token (from BotFather)</label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)} className={inputClass} placeholder="1234567890:AAGxxxxxxxxxxxxxxx" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>Webhook URL (set when backend is ready)</label>
            <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className={inputClass} placeholder="https://your-backend.com/webhook/telegram" />
          </div>
        </div>

        <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-xl">
          <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-2">Bot Services — Current Phase</p>
          <p className="text-amber-300 text-[11px] leading-relaxed">
            This phase stores the bot configuration. Actual message sending and webhook processing will be wired in when the backend infrastructure is set up. Users can subscribe to bot plans and configure their bots now — the execution layer will be connected later.
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={testToken} disabled={testing} variant="outline" className="gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            Test Token
          </Button>
          <Button onClick={save} disabled={saving} className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Config
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle className="uppercase italic tracking-tighter text-sm flex items-center gap-2">
          <Bot className="w-4 h-4 text-slate-400" /> Bot Services Roadmap
        </CardTitle>
        {[
          { phase: 'Current', label: 'Config & Subscriptions', desc: 'Users subscribe to bot plans and configure their tokens. Data structure is ready in Firestore.', done: true },
          { phase: 'Next', label: 'Backend Webhook Layer', desc: 'Netlify Function or Firebase Cloud Function to receive Telegram updates and route messages.', done: false },
          { phase: 'Then', label: 'Bot Logic & Commands', desc: 'Command handlers, auto-replies, project status notifications via Telegram.', done: false },
          { phase: 'Later', label: 'WhatsApp & Discord', desc: 'Additional bot platforms using the same subscription architecture.', done: false },
        ].map(item => (
          <div key={item.phase} className={`flex gap-4 p-4 rounded-xl ${item.done ? 'bg-brand-success/5 border border-brand-success/20' : 'bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-white/5'}`}>
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.done ? 'bg-brand-success' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.phase}</p>
              <p className="text-sm font-bold text-brand-text-bold dark:text-white">{item.label}</p>
              <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
