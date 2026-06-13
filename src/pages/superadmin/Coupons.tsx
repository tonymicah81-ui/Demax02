import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, RefreshCw, Gift, Save, Loader2, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, getDocs } from '../../firebase';
import { useAuth } from '../../AuthContext';
import { generateBulkCodes } from '../../lib/couponService';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'motion/react';

type CouponType = 'marketplace' | 'subscription';
type DiscountType = 'percentage' | 'fixed';

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  discountType: DiscountType;
  value: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  minAmount: number | null;
  active: boolean;
  description: string;
  createdAt: any;
}

interface Milestone {
  count: number;
  rewardType: 'coupon';
  couponValue: number;
  discountType: DiscountType;
  couponType: CouponType;
  label: string;
}

const BLANK: Partial<Coupon> = {
  code: '', type: 'marketplace', discountType: 'percentage', value: 10,
  usageLimit: null, expiresAt: null, minAmount: null, active: true, description: '',
};

export default function SuperAdminCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<Partial<Coupon>>({ ...BLANK });
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkCount, setBulkCount] = useState(10);
  const [filter, setFilter] = useState<'all' | CouponType>('all');
  const [saving, setSaving] = useState(false);
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [savingMilestones, setSavingMilestones] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), snap => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Coupon[]);
    });
    getDoc(doc(db, 'platform_settings', 'referral_settings')).then(snap => {
      if (snap.exists()) setMilestones(snap.data().milestones || []);
    });
    return () => unsub();
  }, []);

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function saveCoupon() {
    if (!form.code || !form.value) return showMsg('Fill in code and value');
    setSaving(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        code: form.code!.toUpperCase().trim(),
        type: form.type!, discountType: form.discountType!, value: Number(form.value),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usedCount: 0,
        expiresAt: form.expiresAt || null,
        minAmount: form.minAmount ? Number(form.minAmount) : null,
        active: form.active ?? true,
        description: form.description || '',
        createdBy: user?.uid || '',
        createdAt: serverTimestamp(),
      });
      setForm({ ...BLANK });
      setShowForm(false);
      showMsg('Coupon created');
    } catch { showMsg('Failed to create coupon'); }
    finally { setSaving(false); }
  }

  async function toggleActive(coupon: Coupon) {
    await updateDoc(doc(db, 'coupons', coupon.id), { active: !coupon.active });
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Delete this coupon?')) return;
    await deleteDoc(doc(db, 'coupons', id));
    showMsg('Coupon deleted');
  }

  async function generateBulk() {
    if (!bulkCount || bulkCount < 1 || bulkCount > 500) return showMsg('Count must be 1–500');
    setGeneratingBulk(true);
    try {
      const codes = generateBulkCodes(bulkPrefix, bulkCount);
      const batch = codes.map(code => addDoc(collection(db, 'coupons'), {
        code, type: form.type!, discountType: form.discountType!, value: Number(form.value || 10),
        usageLimit: 1, usedCount: 0, expiresAt: form.expiresAt || null, minAmount: null,
        active: true, description: `Bulk generated${bulkPrefix ? ` — ${bulkPrefix}` : ''}`,
        createdBy: user?.uid || '', createdAt: serverTimestamp(),
      }));
      await Promise.all(batch);
      showMsg(`${bulkCount} coupons generated`);
    } catch { showMsg('Bulk generation failed'); }
    finally { setGeneratingBulk(false); }
  }

  async function saveMilestones() {
    setSavingMilestones(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'referral_settings'), { milestones, updatedAt: serverTimestamp() }, { merge: true });
      showMsg('Milestone rewards saved');
    } catch { showMsg('Save failed'); }
    finally { setSavingMilestones(false); }
  }

  function addMilestone() {
    setMilestones(p => [...p, { count: 10, rewardType: 'coupon', couponValue: 20, discountType: 'percentage', couponType: 'marketplace', label: `${p.length + 1}st Milestone` }]);
  }

  function updMilestone(idx: number, key: keyof Milestone, val: any) {
    setMilestones(p => p.map((m, i) => i === idx ? { ...m, [key]: val } : m));
  }

  const filtered = coupons.filter(c => filter === 'all' || c.type === filter);
  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  return (
    <div className="space-y-8">
      {toast && <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.includes('ailed') || toast.includes('error') ? 'bg-red-600' : 'bg-brand-success'}`}>{toast}</div>}

      <div className="pb-6 border-b border-brand-border dark:border-white/5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Coupon System</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">Create & Manage Discount Codes // Super Admin Only</p>
        </div>
        <Button onClick={() => setShowForm(p => !p)} className="gap-2 bg-brand-accent text-white">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="space-y-6">
              <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Tag className="w-4 h-4 text-brand-accent" /> Create Coupon</CardTitle>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2"><label className={labelClass}>Code</label><input value={form.code || ''} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className={inputClass} placeholder="PROMO2026" /></div>
                <div className="space-y-2"><label className={labelClass}>Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as CouponType }))} className={inputClass}>
                    <option value="marketplace">Marketplace (Store)</option>
                    <option value="subscription">Subscription Plans</option>
                  </select>
                </div>
                <div className="space-y-2"><label className={labelClass}>Discount Type</label>
                  <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value as DiscountType }))} className={inputClass}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="space-y-2"><label className={labelClass}>Value ({form.discountType === 'percentage' ? '%' : '$'})</label><input type="number" value={form.value || ''} onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))} className={inputClass} placeholder="10" /></div>
                <div className="space-y-2"><label className={labelClass}>Usage Limit (blank = unlimited)</label><input type="number" value={form.usageLimit || ''} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value ? Number(e.target.value) : null }))} className={inputClass} placeholder="Unlimited" /></div>
                <div className="space-y-2"><label className={labelClass}>Min Order Amount ($)</label><input type="number" value={form.minAmount || ''} onChange={e => setForm(p => ({ ...p, minAmount: e.target.value ? Number(e.target.value) : null }))} className={inputClass} placeholder="None" /></div>
                <div className="space-y-2"><label className={labelClass}>Expires At</label><input type="date" value={form.expiresAt || ''} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value || null }))} className={inputClass} /></div>
                <div className="space-y-2 md:col-span-2"><label className={labelClass}>Description</label><input value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Optional description..." /></div>
              </div>
              <Button onClick={saveCoupon} disabled={saving} className="bg-brand-accent text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Coupon
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="space-y-4">
        <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><RefreshCw className="w-4 h-4 text-brand-success" /> Bulk Generate</CardTitle>
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2"><label className={labelClass}>Prefix (optional)</label><input value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value.toUpperCase())} className={inputClass} placeholder="SUMMER" /></div>
          <div className="space-y-2"><label className={labelClass}>Count (max 500)</label><input type="number" value={bulkCount} onChange={e => setBulkCount(Number(e.target.value))} className={inputClass} min={1} max={500} /></div>
          <div className="space-y-2"><label className={labelClass}>Coupon Type</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as CouponType }))} className={inputClass}><option value="marketplace">Marketplace</option><option value="subscription">Subscription</option></select></div>
          <Button onClick={generateBulk} disabled={generatingBulk} className="bg-brand-success text-white gap-2 h-12">
            {generatingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Generate
          </Button>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Target className="w-4 h-4 text-amber-400" /> Referral Milestone Rewards</CardTitle>
          <Button size="sm" onClick={addMilestone} variant="outline" className="gap-2 text-[10px]"><Plus className="w-3.5 h-3.5" /> Add Milestone</Button>
        </div>
        <p className="text-[11px] text-slate-400">Set referral count thresholds that automatically grant a coupon to the referrer.</p>
        <div className="space-y-3">
          {milestones.length === 0 && <p className="text-[11px] text-slate-400 italic">No milestones set yet.</p>}
          {milestones.map((m, idx) => (
            <div key={idx} className="grid md:grid-cols-6 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-brand-border dark:border-white/5">
              <div className="space-y-1"><label className={labelClass}>Label</label><input value={m.label} onChange={e => updMilestone(idx, 'label', e.target.value)} className={inputClass + ' text-xs'} placeholder="1st Milestone" /></div>
              <div className="space-y-1"><label className={labelClass}>Referral Count</label><input type="number" value={m.count} onChange={e => updMilestone(idx, 'count', Number(e.target.value))} className={inputClass + ' text-xs'} /></div>
              <div className="space-y-1"><label className={labelClass}>Reward Value</label><input type="number" value={m.couponValue} onChange={e => updMilestone(idx, 'couponValue', Number(e.target.value))} className={inputClass + ' text-xs'} /></div>
              <div className="space-y-1"><label className={labelClass}>Discount Type</label><select value={m.discountType} onChange={e => updMilestone(idx, 'discountType', e.target.value)} className={inputClass + ' text-xs'}><option value="percentage">%</option><option value="fixed">$</option></select></div>
              <div className="space-y-1"><label className={labelClass}>Coupon For</label><select value={m.couponType} onChange={e => updMilestone(idx, 'couponType', e.target.value)} className={inputClass + ' text-xs'}><option value="marketplace">Marketplace</option><option value="subscription">Subscription</option></select></div>
              <button onClick={() => setMilestones(p => p.filter((_, i) => i !== idx))} className="self-end p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-400 hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <Button onClick={saveMilestones} disabled={savingMilestones} className="bg-brand-accent text-white gap-2">
          {savingMilestones ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Milestones
        </Button>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">All Coupons ({filtered.length})</h2>
          <div className="flex gap-2">
            {(['all', 'marketplace', 'subscription'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-brand-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center opacity-30"><Tag className="w-16 h-16 mx-auto mb-4 text-slate-400" /><p className="font-black uppercase tracking-widest text-sm">No Coupons</p></div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <Card key={c.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs", c.active ? 'bg-brand-success/10 text-brand-success' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight font-mono">{c.code}</p>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${c.type === 'marketplace' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-amber-500/10 text-amber-500'}`}>{c.type}</span>
                        {!c.active && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Inactive</span>}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {c.discountType === 'percentage' ? `${c.value}% off` : `$${c.value} off`}
                        {c.usageLimit !== null ? ` · ${c.usedCount}/${c.usageLimit} used` : ` · ${c.usedCount} used · Unlimited`}
                        {c.expiresAt ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(c)} className="text-[10px]">
                      {c.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <button onClick={() => deleteCoupon(c.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
