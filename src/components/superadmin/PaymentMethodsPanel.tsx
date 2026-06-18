import { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../../firebase';
import { Save, Loader2, Plus, Trash2, CheckCircle2, X, Building2 } from 'lucide-react';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export const PAYMENT_COUNTRIES = [
  'Nigeria', 'Ghana', 'South Africa', 'Kenya', 'Uganda', 'Tanzania',
  'Rwanda', 'Zimbabwe', 'Zambia', 'Cameroon', 'Senegal', 'Ethiopia', 'Egypt',
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Netherlands', 'Spain', 'Italy',
  'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait',
  'India', 'Pakistan', 'Bangladesh',
  'Other',
];

export const CRYPTO_COINS: Record<string, string[]> = {
  'Bitcoin (BTC)': ['Bitcoin'],
  'Ethereum (ETH)': ['ERC20'],
  'USDT': ['ERC20', 'TRC20', 'BEP20'],
  'USDC': ['ERC20', 'BEP20'],
  'Litecoin (LTC)': ['Litecoin'],
  'BNB': ['BEP20'],
};

export const THIRD_PARTY_PLATFORMS = [
  'PayPal', 'Skrill', 'Cash App', 'Zelle', 'Venmo', 'Wise',
  'Western Union', 'MoneyGram', 'Remitly', 'WorldRemit',
  'Payoneer', 'Neteller', 'Perfect Money', 'Revolut', 'Other',
];

export interface BankMethod {
  id: string; country: string; bankName: string;
  accountName: string; accountNumber: string; sortCode: string; note: string;
}
export interface CryptoMethod {
  id: string; coin: string; network: string; address: string; note: string;
}
export interface ThirdPartyMethod {
  id: string; platform: string; handle: string; note: string;
}
export interface PaymentMethodsDoc {
  banks: BankMethod[];
  crypto: CryptoMethod[];
  thirdParty: ThirdPartyMethod[];
}

function genId() { return Math.random().toString(36).slice(2, 10); }

const inp = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
const lbl = "text-[10px] font-black text-slate-500 uppercase tracking-widest";
const sel = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white cursor-pointer";

type SubTab = 'banks' | 'crypto' | 'thirdParty';

export default function PaymentMethodsPanel() {
  const [subTab, setSubTab] = useState<SubTab>('banks');
  const [banks, setBanks] = useState<BankMethod[]>([]);
  const [crypto, setCrypto] = useState<CryptoMethod[]>([]);
  const [thirdParty, setThirdParty] = useState<ThirdPartyMethod[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [bankForm, setBankForm] = useState<Omit<BankMethod, 'id'>>({
    country: 'Nigeria', bankName: '', accountName: '', accountNumber: '', sortCode: '', note: '',
  });
  const [cryptoForm, setCryptoForm] = useState<Omit<CryptoMethod, 'id'>>({
    coin: 'Bitcoin (BTC)', network: 'Bitcoin', address: '', note: '',
  });
  const [tpForm, setTpForm] = useState<Omit<ThirdPartyMethod, 'id'>>({
    platform: 'PayPal', handle: '', note: '',
  });

  useEffect(() => {
    getDoc(doc(db, 'platform_settings', 'payment_methods')).then(snap => {
      if (snap.exists()) {
        const d = snap.data() as PaymentMethodsDoc;
        setBanks(d.banks || []);
        setCrypto(d.crypto || []);
        setThirdParty(d.thirdParty || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'payment_methods'), {
        banks, crypto, thirdParty, updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const addBank = () => {
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim()) return;
    setBanks(prev => [...prev, { id: genId(), ...bankForm }]);
    setBankForm({ country: 'Nigeria', bankName: '', accountName: '', accountNumber: '', sortCode: '', note: '' });
    setShowForm(false);
  };

  const addCrypto = () => {
    if (!cryptoForm.address.trim()) return;
    setCrypto(prev => [...prev, { id: genId(), ...cryptoForm }]);
    setCryptoForm({ coin: 'Bitcoin (BTC)', network: 'Bitcoin', address: '', note: '' });
    setShowForm(false);
  };

  const addThirdParty = () => {
    if (!tpForm.handle.trim()) return;
    setThirdParty(prev => [...prev, { id: genId(), ...tpForm }]);
    setTpForm({ platform: 'PayPal', handle: '', note: '' });
    setShowForm(false);
  };

  const removeBank = (id: string) => setBanks(prev => prev.filter(b => b.id !== id));
  const removeCrypto = (id: string) => setCrypto(prev => prev.filter(c => c.id !== id));
  const removeTP = (id: string) => setThirdParty(prev => prev.filter(t => t.id !== id));

  const subTabs: { id: SubTab; label: string; count: number }[] = [
    { id: 'banks', label: '🏦 Bank Transfer', count: banks.length },
    { id: 'crypto', label: '₿ Crypto', count: crypto.length },
    { id: 'thirdParty', label: '📲 Third Party', count: thirdParty.length },
  ];

  if (loading) {
    return <Card className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-accent" /></Card>;
  }

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-accent" /> Payment Methods
        </CardTitle>
        <Button
          onClick={save}
          disabled={saving}
          className={cn("gap-2 text-white", saved ? 'bg-brand-success' : 'bg-brand-accent hover:bg-brand-accent/90')}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save All'}
        </Button>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Configure payment methods available to users when adding funds. Users will see methods based on their selected country and payment type.
      </p>

      <div className="flex gap-2 flex-wrap border-b border-brand-border dark:border-white/5 pb-4">
        {subTabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setSubTab(t.id); setShowForm(false); }}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              subTab === t.id
                ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'
            )}
          >
            {t.label}
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-black",
              subTab === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            )}>{t.count}</span>
          </button>
        ))}
      </div>

      {subTab === 'banks' && (
        <div className="space-y-4">
          {banks.length === 0 && !showForm && (
            <div className="text-center py-8 text-[11px] text-slate-400 font-black uppercase tracking-widest">No bank accounts configured yet</div>
          )}
          {banks.map(b => (
            <div key={b.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded">{b.country}</span>
                  <span className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">{b.bankName}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{b.accountName}</p>
                <p className="text-[11px] font-mono text-brand-accent font-bold">{b.accountNumber}</p>
                {b.sortCode && <p className="text-[10px] text-slate-400 font-mono">Sort/Routing: {b.sortCode}</p>}
                {b.note && <p className="text-[10px] text-slate-400 italic">{b.note}</p>}
              </div>
              <button onClick={() => removeBank(b.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {showForm ? (
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-brand-accent/30 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Add Bank Account</p>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={lbl}>Country *</label>
                  <select value={bankForm.country} onChange={e => setBankForm(p => ({ ...p, country: e.target.value }))} className={sel}>
                    {PAYMENT_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Bank Name *</label>
                  <input value={bankForm.bankName} onChange={e => setBankForm(p => ({ ...p, bankName: e.target.value }))} className={inp} placeholder="e.g. GTBank, Zenith, Chase" />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Account Name *</label>
                  <input value={bankForm.accountName} onChange={e => setBankForm(p => ({ ...p, accountName: e.target.value }))} className={inp} placeholder="Full name on account" />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Account Number *</label>
                  <input value={bankForm.accountNumber} onChange={e => setBankForm(p => ({ ...p, accountNumber: e.target.value }))} className={inp} placeholder="0123456789" />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Sort Code / Routing / IBAN <span className="font-normal normal-case">(optional)</span></label>
                  <input value={bankForm.sortCode} onChange={e => setBankForm(p => ({ ...p, sortCode: e.target.value }))} className={inp} placeholder="Optional" />
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Note <span className="font-normal normal-case">(optional)</span></label>
                  <input value={bankForm.note} onChange={e => setBankForm(p => ({ ...p, note: e.target.value }))} className={inp} placeholder="e.g. Use your username as reference" />
                </div>
              </div>
              <Button onClick={addBank} disabled={!bankForm.bankName.trim() || !bankForm.accountNumber.trim()} className="bg-brand-accent text-white gap-2">
                <Plus className="w-4 h-4" /> Add Bank
              </Button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-border dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-brand-accent hover:text-brand-accent transition-all">
              <Plus className="w-4 h-4" /> Add Bank Account
            </button>
          )}
        </div>
      )}

      {subTab === 'crypto' && (
        <div className="space-y-4">
          {crypto.length === 0 && !showForm && (
            <div className="text-center py-8 text-[11px] text-slate-400 font-black uppercase tracking-widest">No crypto wallets configured yet</div>
          )}
          {crypto.map(c => (
            <div key={c.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded">{c.coin}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded">{c.network}</span>
                </div>
                <p className="text-[11px] font-mono text-brand-accent font-bold break-all">{c.address}</p>
                {c.note && <p className="text-[10px] text-slate-400 italic">{c.note}</p>}
              </div>
              <button onClick={() => removeCrypto(c.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {showForm ? (
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-brand-accent/30 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Add Crypto Wallet</p>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={lbl}>Coin *</label>
                  <select
                    value={cryptoForm.coin}
                    onChange={e => {
                      const coin = e.target.value;
                      const networks = CRYPTO_COINS[coin] || [];
                      setCryptoForm(p => ({ ...p, coin, network: networks[0] || '' }));
                    }}
                    className={sel}
                  >
                    {Object.keys(CRYPTO_COINS).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Network *</label>
                  <select value={cryptoForm.network} onChange={e => setCryptoForm(p => ({ ...p, network: e.target.value }))} className={sel}>
                    {(CRYPTO_COINS[cryptoForm.coin] || []).map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={lbl}>Wallet Address *</label>
                <input value={cryptoForm.address} onChange={e => setCryptoForm(p => ({ ...p, address: e.target.value }))} className={inp} placeholder="e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf..." />
              </div>
              <div className="space-y-1.5">
                <label className={lbl}>Note <span className="font-normal normal-case">(optional)</span></label>
                <input value={cryptoForm.note} onChange={e => setCryptoForm(p => ({ ...p, note: e.target.value }))} className={inp} placeholder="e.g. Send only on TRC20 network" />
              </div>
              <Button onClick={addCrypto} disabled={!cryptoForm.address.trim()} className="bg-brand-accent text-white gap-2">
                <Plus className="w-4 h-4" /> Add Wallet
              </Button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-border dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-brand-accent hover:text-brand-accent transition-all">
              <Plus className="w-4 h-4" /> Add Crypto Wallet
            </button>
          )}
        </div>
      )}

      {subTab === 'thirdParty' && (
        <div className="space-y-4">
          {thirdParty.length === 0 && !showForm && (
            <div className="text-center py-8 text-[11px] text-slate-400 font-black uppercase tracking-widest">No third-party accounts configured yet</div>
          )}
          {thirdParty.map(t => (
            <div key={t.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-500/10 text-green-600 rounded">{t.platform}</span>
                </div>
                <p className="text-sm font-bold text-brand-text-bold dark:text-white">{t.handle}</p>
                {t.note && <p className="text-[10px] text-slate-400 italic">{t.note}</p>}
              </div>
              <button onClick={() => removeTP(t.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {showForm ? (
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-brand-accent/30 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Add Third-Party Account</p>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={lbl}>Platform *</label>
                  <select value={tpForm.platform} onChange={e => setTpForm(p => ({ ...p, platform: e.target.value }))} className={sel}>
                    {THIRD_PARTY_PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Username / Email / Phone *</label>
                  <input value={tpForm.handle} onChange={e => setTpForm(p => ({ ...p, handle: e.target.value }))} className={inp} placeholder="e.g. @username or pay@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={lbl}>Note <span className="font-normal normal-case">(optional)</span></label>
                <input value={tpForm.note} onChange={e => setTpForm(p => ({ ...p, note: e.target.value }))} className={inp} placeholder="e.g. Include your name in the note" />
              </div>
              <Button onClick={addThirdParty} disabled={!tpForm.handle.trim()} className="bg-brand-accent text-white gap-2">
                <Plus className="w-4 h-4" /> Add Account
              </Button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-border dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-brand-accent hover:text-brand-accent transition-all">
              <Plus className="w-4 h-4" /> Add Third-Party Account
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
