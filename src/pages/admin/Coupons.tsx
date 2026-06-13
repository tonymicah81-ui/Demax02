import { useState, useEffect } from 'react';
import { Tag, Search, Gift, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db, collection, getDocs, addDoc, query, where, serverTimestamp } from '../../firebase';
import { validateCoupon } from '../../lib/couponService';
import { cn } from '../../utils/cn';

export default function AdminCoupons() {
  const [validateCode, setValidateCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantCouponId, setGrantCouponId] = useState('');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [granting, setGranting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    getDocs(collection(db, 'coupons')).then(snap => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((c: any) => c.active)));
  }, []);

  function showMsg(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); }

  async function handleValidate() {
    if (!validateCode.trim()) return;
    setValidating(true);
    setValidationResult(null);
    const result = await validateCoupon(validateCode, 'marketplace', 0);
    setValidationResult(result);
    setValidating(false);
  }

  async function handleGrant() {
    if (!grantUserId || !grantCouponId) return showMsg('Select a user and coupon', false);
    const coupon = coupons.find(c => c.id === grantCouponId);
    if (!coupon) return showMsg('Coupon not found', false);
    setGranting(true);
    try {
      await addDoc(collection(db, 'user_coupons'), {
        userId: grantUserId,
        couponId: grantCouponId,
        couponCode: coupon.code,
        grantedBy: 'admin',
        grantedAt: serverTimestamp(),
        used: false,
      });
      await addDoc(collection(db, 'user_notifications'), {
        userId: grantUserId,
        title: 'Coupon Granted',
        message: `A coupon code "${coupon.code}" has been added to your account.`,
        read: false,
        createdAt: serverTimestamp(),
      });
      setGrantUserId('');
      setGrantCouponId('');
      showMsg('Coupon granted to user', true);
    } catch { showMsg('Failed to grant coupon', false); }
    finally { setGranting(false); }
  }

  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";

  return (
    <div className="space-y-8">
      {toast && <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest shadow-2xl ${toast.ok ? 'bg-brand-success' : 'bg-red-600'}`}>{toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{toast.msg}</div>}

      <div className="pb-6 border-b border-brand-border dark:border-white/5">
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Coupon Management</h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">Validate & Grant Codes // Admin Access</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="space-y-6">
          <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Search className="w-4 h-4 text-brand-accent" /> Validate Coupon</CardTitle>
          <p className="text-[11px] text-slate-400">Check if a coupon code is valid — for customer support queries.</p>
          <div className="flex gap-3">
            <input value={validateCode} onChange={e => setValidateCode(e.target.value.toUpperCase())} className={inputClass} placeholder="Enter coupon code..." onKeyDown={e => e.key === 'Enter' && handleValidate()} />
            <Button onClick={handleValidate} disabled={validating} className="bg-brand-accent text-white shrink-0 gap-2">
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </Button>
          </div>
          {validationResult && (
            <div className={cn("p-4 rounded-xl border", validationResult.valid ? 'bg-brand-success/5 border-brand-success/20' : 'bg-red-950/20 border-red-900/30')}>
              <div className="flex items-center gap-2 mb-3">
                {validationResult.valid ? <CheckCircle2 className="w-4 h-4 text-brand-success" /> : <XCircle className="w-4 h-4 text-red-400" />}
                <p className={cn("text-xs font-black uppercase tracking-widest", validationResult.valid ? 'text-brand-success' : 'text-red-400')}>
                  {validationResult.valid ? 'Valid Coupon' : 'Invalid Coupon'}
                </p>
              </div>
              {validationResult.valid && validationResult.coupon ? (
                <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                  <p><span className="text-white">Code:</span> {validationResult.coupon.code}</p>
                  <p><span className="text-white">Type:</span> {validationResult.coupon.type}</p>
                  <p><span className="text-white">Discount:</span> {validationResult.coupon.discountType === 'percentage' ? `${validationResult.coupon.value}%` : `$${validationResult.coupon.value}`}</p>
                  <p><span className="text-white">Used:</span> {validationResult.coupon.usedCount}{validationResult.coupon.usageLimit !== null ? `/${validationResult.coupon.usageLimit}` : ' (unlimited)'}</p>
                  {validationResult.coupon.expiresAt && <p><span className="text-white">Expires:</span> {new Date(validationResult.coupon.expiresAt).toLocaleDateString()}</p>}
                </div>
              ) : (
                <p className="text-[11px] text-red-400">{validationResult.error}</p>
              )}
            </div>
          )}
        </Card>

        <Card className="space-y-6">
          <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2"><Gift className="w-4 h-4 text-amber-400" /> Grant Coupon to User</CardTitle>
          <p className="text-[11px] text-slate-400">Add a coupon directly to a user's account. They will be notified.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select User</label>
              <select value={grantUserId} onChange={e => setGrantUserId(e.target.value)} className={inputClass}>
                <option value="">Choose user...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username} — {u.email}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Coupon</label>
              <select value={grantCouponId} onChange={e => setGrantCouponId(e.target.value)} className={inputClass}>
                <option value="">Choose coupon...</option>
                {coupons.map(c => <option key={c.id} value={c.id}>{c.code} — {c.discountType === 'percentage' ? `${c.value}%` : `$${c.value}`} ({c.type})</option>)}
              </select>
            </div>
            <Button onClick={handleGrant} disabled={granting} className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white">
              {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Grant Coupon
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
