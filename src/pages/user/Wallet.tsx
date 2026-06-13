import { useState, useEffect } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Wallet, Plus, ArrowUpRight, History, Image as ImageIcon, Loader2, Info } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { db, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, getDoc } from "../../firebase";
import { cn } from "../../utils/cn";

interface Transaction {
  id: string;
  type: "deposit" | "payment" | "refund";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string;
  createdAt: any;
  proofUrl?: string;
}

export default function WalletPage() {
  const { profile, user } = useAuth();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState("");
  const [image, setImage] = useState<string>(""); // Mocking file upload as base64 or placeholder for now
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
      setLoading(false);
    });

    // Fetch bank details from super admin config
    getDoc(doc(db, "system_config", "payment_details")).then(snap => {
      if (snap.exists()) setBankDetails(snap.data());
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "deposit",
        amount: Number(amount),
        status: "pending",
        description: "Fund Deposit Request",
        proofUrl: image || "https://picsum.photos/seed/proof/400/600", // Using placeholder for now as requested by user's "proof upload"
        createdAt: serverTimestamp(),
      });
      
      // Also notify Admin
      await addDoc(collection(db, "admin_notifications"), {
        userId: user.uid,
        username: profile?.username,
        type: "payment_review",
        title: "New Deposit Proof",
        message: `${profile?.username} uploaded a deposit proof for $${amount}.`,
        read: false,
        createdAt: serverTimestamp(),
      });

      alert("Proof transmitted to centralHQ. Awaiting administrative verification.");
      setShowAddFunds(false);
      setAmount("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Wallet</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Manage your balance and payment history
          </p>
        </div>
        <Button onClick={() => setShowAddFunds(true)} className="gap-2 bg-brand-success hover:bg-green-600 shadow-xl shadow-green-500/20">
          <Plus className="w-4 h-4" /> Add Funds
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <Card className="bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <Wallet className="w-5 h-5 text-brand-success" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Balance_Vault</span>
                 </div>
                 <h2 className="text-6xl font-black tracking-tighter italic leading-none truncate">
                    ${profile?.balance?.toFixed(2) || "0.00"}
                 </h2>
                 <div className="mt-6 flex items-center gap-2 text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
                    <span>STATUS: LIQUID_READY</span>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-full bg-brand-accent/5 skew-x-[45deg] pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-700" />
           </Card>

           <Card className="border shadow-md bg-white dark:bg-slate-900">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest italic mb-6 text-slate-400">Payment Instructions</CardTitle>
              {bankDetails ? (
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5 font-mono text-[10px] text-brand-text dark:text-white uppercase leading-relaxed relative overflow-hidden">
                      <div className="relative z-10 space-y-2">
                        <p className="flex justify-between"><span className="text-slate-500">Bank:</span> <span>{bankDetails.bankName}</span></p>
                        <p className="flex justify-between"><span className="text-slate-500">Name:</span> <span>{bankDetails.accountName}</span></p>
                        <p className="flex justify-between"><span className="text-slate-500">Account:</span> <span className="text-brand-accent">{bankDetails.accountNumber}</span></p>
                        {bankDetails.reference && <p className="flex justify-between border-t border-brand-border pt-2 mt-2"><span className="text-slate-500">REF:</span> <span>{bankDetails.reference}</span></p>}
                      </div>
                      <div className="absolute top-0 right-0 p-2 opacity-5 italic font-black text-4xl select-none">DATA_P</div>
                   </div>
                   <div className="p-4 border border-brand-accent/20 bg-brand-accent/5 rounded-xl flex gap-3 italic">
                      <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Please ensure the exact amount is transmitted to avoid protocol synchronization delays.</p>
                   </div>
                </div>
              ) : (
                <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Admin Config...</div>
              )}
           </Card>
        </div>

        <div className="lg:col-span-2">
           <Card className="h-full border shadow-md bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-8">
                 <CardTitle className="text-sm italic uppercase tracking-tighter">Transaction History</CardTitle>
                 <History className="w-4 h-4 text-slate-300" />
              </div>
              <div className="space-y-3">
                 {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                       <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
                       <p className="text-[10px] font-mono text-slate-400">Loading transactions...</p>
                    </div>
                 ) : transactions.length === 0 ? (
                    <div className="py-12 text-center opacity-30 italic font-black text-sm uppercase tracking-widest">No Logged Activities</div>
                 ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 hover:border-brand-accent/30 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className={cn(
                               "w-12 h-12 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110",
                               tx.amount > 0 ? "bg-green-500/10 text-brand-success border-green-500/20" : 
                               "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            )}>
                               <ArrowUpRight className={cn("w-5 h-5", tx.amount < 0 && "rotate-90")} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{tx.id.slice(0,8)}</p>
                               <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-brand-text-bold dark:text-white uppercase tracking-tight italic">{tx.type}</p>
                                  <span className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                    tx.status === 'completed' ? "bg-brand-success/10 text-brand-success" : 
                                    tx.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                  )}>
                                    {tx.status}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={cn(
                               "text-lg font-black italic tracking-tighter",
                               tx.amount > 0 ? "text-brand-success" : "text-brand-text-bold dark:text-white"
                            )}>
                               {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                            </p>
                            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                               {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </p>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </Card>
        </div>
      </div>

      <AnimatePresence>
        {showAddFunds && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/10 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></div>
                    <h2 className="text-xl font-black text-brand-text-bold dark:text-white italic uppercase tracking-tighter">Initialize Deposit_</h2>
                 </div>
                 <button onClick={() => setShowAddFunds(false)} className="px-3 py-3 text-slate-400 hover:text-white transition-colors">✕</button>
              </div>

              <form onSubmit={handleAddFunds} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Deposit Amount ($)</label>
                    <input 
                      type="number" 
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-sm font-black focus:outline-none focus:border-brand-accent transition-all text-brand-text-bold dark:text-white"
                      placeholder="0.00"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Transaction Proof (Receipt Image)</label>
                    <div className="relative group">
                       <input 
                         type="file" 
                         className="hidden"
                         id="proof-upload"
                         accept="image/*"
                         onChange={(e) => {
                            if (e.target.files?.[0]) {
                              // We use a mock URL for now as per user preference for proof upload logic
                              setImage(e.target.files[0].name); 
                            }
                         }}
                       />
                       <label 
                         htmlFor="proof-upload"
                         className="flex flex-col items-center justify-center w-full h-40 bg-slate-100/50 dark:bg-slate-950/50 border-2 border-dashed border-brand-border dark:border-white/5 rounded-2xl cursor-pointer hover:border-brand-accent/50 transition-all group overflow-hidden relative"
                       >
                          {image ? (
                             <div className="flex flex-col items-center gap-2 p-4">
                                <PackageCheck className="w-8 h-8 text-brand-success" />
                                <p className="text-[10px] font-black text-brand-success uppercase text-center">{image}</p>
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest">CLICK_TO_CHANGE</span>
                             </div>
                          ) : (
                             <>
                               <ImageIcon className="w-10 h-10 text-slate-300 mb-3 group-hover:text-brand-accent transition-all duration-500 group-hover:scale-110" />
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Transfuse Proof Asset_</p>
                             </>
                          )}
                          <div className="absolute inset-0 bg-brand-accent opacity-0 group-hover:opacity-[0.02] transition-opacity" />
                       </label>
                    </div>
                 </div>

                 <Button type="submit" disabled={submitting} className="w-full h-16 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/20">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Payment Request"}
                 </Button>
                 
                 <p className="text-[8px] text-center text-slate-500 uppercase font-bold tracking-widest px-4 leading-relaxed opacity-50">
                   Protocol authorization is manual. Verifiers will check your proof against real-world assets before balance synchronization.
                 </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal PackageCheck icon replacement since it might not be in the view
function PackageCheck(props: any) {
   return (
     <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>
   )
}
