import { useState, useEffect } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Package, CheckCircle2, Loader2, AlertCircle, Tag, X } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { db, collection, query, where, onSnapshot, doc, runTransaction, serverTimestamp } from "../../firebase";
import { validateCoupon, redeemCoupon } from "../../lib/couponService";
import { cn } from "../../utils/cn";

type Duration = 1 | 3 | 6 | 12;

const DURATION_OPTIONS: { value: Duration; label: string; multiplier: number; savings?: string }[] = [
  { value: 1,  label: '1 Month',   multiplier: 1.0 },
  { value: 3,  label: '3 Months',  multiplier: 2.5, savings: 'Save 17%' },
  { value: 6,  label: '6 Months',  multiplier: 4.5, savings: 'Save 25%' },
  { value: 12, label: '12 Months', multiplier: 8.0, savings: 'Save 33%' },
];

interface Project {
  id: string;
  name: string;
  subscriptions?: string[];
}

interface SubscriptionModel {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export default function Subscription() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [models, setModels] = useState<SubscriptionModel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<Duration>(1);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsubProjects = onSnapshot(query(collection(db, "projects"), where("userId", "==", user.uid)), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    });
    const unsubModels = onSnapshot(collection(db, "subscription_models"), (snap) => {
      setModels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubscriptionModel[]);
      setLoading(false);
    });
    return () => { unsubProjects(); unsubModels(); };
  }, [user]);

  const getDurationConfig = () => DURATION_OPTIONS.find(d => d.value === selectedDuration)!;

  const getPrice = (basePrice: number) => {
    const cfg = getDurationConfig();
    let total = basePrice * cfg.multiplier;
    if (appliedCoupon) {
      const discount = appliedCoupon.discountType === 'percentage'
        ? (total * appliedCoupon.value) / 100
        : Math.min(appliedCoupon.value, total);
      total = Math.max(0, total - discount);
    }
    return total;
  };

  const getExpiry = (): Date => {
    const days = selectedDuration === 1 ? 30 : selectedDuration === 3 ? 90 : selectedDuration === 6 ? 180 : 365;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  };

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponError('');
    const result = await validateCoupon(couponCode, 'subscription', 0);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
    } else {
      setCouponError(result.error || 'Invalid coupon');
      setAppliedCoupon(null);
    }
    setCouponValidating(false);
  }

  const handleActivate = async (model: SubscriptionModel) => {
    if (!user || !profile || !selectedProjectId) return;
    const finalPrice = getPrice(model.price);
    setActivationError("");
    setActivationSuccess("");

    if ((profile.balance || 0) < finalPrice) {
      setActivationError("Insufficient balance. Please add funds to your Wallet first.");
      return;
    }

    const project = projects.find(p => p.id === selectedProjectId);
    if (project?.subscriptions?.includes(model.id)) {
      setActivationError("This project already has an active subscription for this service.");
      return;
    }

    setProcessingId(model.id);
    try {
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, "users", user.uid);
        const projectRef = doc(db, "projects", selectedProjectId);
        const userDoc = await tx.get(userRef);
        if (!userDoc.exists()) throw new Error("Account not found");
        const currentBalance = userDoc.data().balance || 0;
        if (currentBalance < finalPrice) throw new Error("Insufficient balance");

        tx.update(userRef, { balance: currentBalance - finalPrice });
        const currentSubs = project?.subscriptions || [];
        const expiry = getExpiry();
        tx.update(projectRef, {
          subscriptions: [...currentSubs, model.id],
          [`sub_${model.id}_expiry`]: expiry,
          [`sub_${model.id}_duration`]: selectedDuration,
        });

        const txRef = doc(collection(db, "transactions"));
        tx.set(txRef, {
          userId: user.uid, type: "payment", amount: -finalPrice, status: "completed",
          description: `Subscription: ${model.name} × ${selectedDuration} month(s) for ${project?.name}`,
          createdAt: serverTimestamp()
        });

        const notifRef = doc(collection(db, "user_notifications"));
        tx.set(notifRef, {
          userId: user.uid, title: "Service Activated",
          message: `${model.name} is now active for ${project?.name} (${selectedDuration} month${selectedDuration > 1 ? 's' : ''}).`,
          read: false, createdAt: serverTimestamp()
        });
      });
      if (appliedCoupon) { try { await redeemCoupon(appliedCoupon.id, user.uid); } catch {} }
      setActivationSuccess(`${model.name} activated for ${selectedDuration} month${selectedDuration > 1 ? 's' : ''}.`);
      setTimeout(() => setActivationSuccess(""), 4000);
    } catch (err: any) {
      console.error(err);
      setActivationError(err?.message || "Activation failed. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
     return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
           <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading plans...</p>
        </div>
     );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Subscriptions</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Manage your active services
          </p>
        </div>
      </div>

      {activationError && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[11px] font-bold text-red-500 uppercase tracking-wide">{activationError}</p>
          <button onClick={() => setActivationError("")} className="ml-auto text-red-400 hover:text-red-500"><X className="w-4 h-4" /></button>
        </div>
      )}

      {activationSuccess && (
        <div className="flex items-center gap-3 p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl">
          <CheckCircle2 className="w-4 h-4 text-brand-success shrink-0" />
          <p className="text-[11px] font-bold text-brand-success uppercase tracking-wide">{activationSuccess}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           <Card className="bg-white dark:bg-slate-900 border-none shadow-md">
              <CardTitle className="tracking-tighter uppercase italic text-sm mb-6">Select Project</CardTitle>
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl p-5 text-xs font-black uppercase focus:outline-none focus:border-brand-accent transition-all text-brand-text-bold dark:text-white"
              >
                <option value="">-- Select a project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
           </Card>

           <Card className="bg-white dark:bg-slate-900 border-none shadow-md">
              <CardTitle className="tracking-tighter uppercase italic text-sm mb-6">Subscription Duration</CardTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSelectedDuration(opt.value)}
                    className={cn("p-4 rounded-xl border-2 text-center transition-all", selectedDuration === opt.value ? "border-brand-accent bg-brand-accent/10" : "border-brand-border dark:border-white/5 hover:border-brand-accent/40")}>
                    <p className={cn("text-xs font-black uppercase tracking-tight", selectedDuration === opt.value ? "text-brand-accent" : "text-brand-text-bold dark:text-white")}>{opt.label}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{opt.value === 1 ? 'Base Price' : `×${opt.multiplier}`}</p>
                    {opt.savings && <p className="text-[9px] font-black text-brand-success mt-1">{opt.savings}</p>}
                  </button>
                ))}
              </div>
           </Card>

           <Card className="bg-white dark:bg-slate-900 border-none shadow-md">
              <CardTitle className="tracking-tighter uppercase italic text-sm mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-amber-400" /> Coupon Code</CardTitle>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-4 bg-brand-success/5 border border-brand-success/20 rounded-xl">
                  <div>
                    <p className="text-xs font-black text-brand-success uppercase tracking-tight">{appliedCoupon.code} — Applied!</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.value}% off` : `$${appliedCoupon.value} off`}</p>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-red-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-xs font-black uppercase focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                      placeholder="ENTER CODE..." />
                    <Button onClick={applyCoupon} disabled={couponValidating || !couponCode.trim()} variant="outline" className="gap-2 text-[10px] shrink-0">
                      {couponValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />} Apply
                    </Button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
                </div>
              )}
           </Card>

           <div className="grid md:grid-cols-2 gap-6">
              {models.length === 0 ? (
                <div className="md:col-span-2 py-20 text-center opacity-30 italic font-black text-sm uppercase tracking-widest">
                   No services available
                </div>
              ) : (
                models.map((s) => {
                  const isActive = projects.find(p => p.id === selectedProjectId)?.subscriptions?.includes(s.id);
                  const finalPrice = getPrice(s.price);
                  const durationCfg = getDurationConfig();
                  return (
                    <Card key={s.id} className={cn(
                      "group transition-all flex flex-col justify-between border-none shadow-lg bg-white dark:bg-slate-900",
                      isActive ? "ring-2 ring-brand-success ring-offset-4 ring-offset-slate-950" : "hover:border-brand-accent/30"
                    )}>
                       <div>
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-accent mb-6 transition-all border border-brand-border dark:border-white/5">
                            <Package className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">{s.name}</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 leading-relaxed italic line-clamp-3">{s.description}</p>
                       </div>
                       <div className="mt-8 pt-6 border-t border-brand-border dark:border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-black text-brand-text-bold dark:text-white italic tracking-tighter">${finalPrice.toFixed(2)}</p>
                            <p className="text-[9px] text-slate-500 font-black uppercase">{durationCfg.label.toUpperCase()}</p>
                            {appliedCoupon && <p className="text-[9px] font-black text-brand-success mt-0.5">Coupon Applied</p>}
                          </div>
                          <Button 
                             disabled={!selectedProjectId || processingId === s.id}
                             onClick={() => handleActivate(s)}
                             className={cn(
                               "h-12 px-6 uppercase text-[10px] tracking-widest",
                               isActive ? "bg-brand-success/10 text-brand-success border border-brand-success/20 pointer-events-none" : "shadow-lg shadow-brand-primary/20"
                             )}
                          >
                             {processingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                              isActive ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Active</> : "Activate"}
                          </Button>
                       </div>
                    </Card>
                  );
                })
              )}
           </div>
        </div>

        <div className="space-y-6">
           <Card className="bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group">
              <CardTitle className="text-white italic tracking-tighter uppercase text-sm relative z-10">Project Status</CardTitle>
              <div className="mt-8 space-y-6 relative z-10">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Selected</span>
                    <span className={selectedProjectId ? "text-brand-success" : "text-amber-500"}>{selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name || 'Selected' : 'None'}</span>
                 </div>
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-300 font-bold uppercase leading-relaxed italic">
                       Subscriptions are project-specific. Activating a service for one project does not apply to other projects.
                    </p>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[45deg] transition-transform duration-700 group-hover:translate-x-10" />
           </Card>

           <Card className="border shadow-md">
              <div className="flex gap-3 text-amber-500 mb-4">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Renewal</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase italic">
                Subscriptions renew automatically from your <span className="text-brand-text-bold dark:text-white">Wallet</span> balance. Keep it topped up before the expiry date.
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}
