import { useState, useEffect, useRef } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Wallet, Plus, ArrowUpRight, History, Image as ImageIcon, Loader2, Info, CheckCircle2, X, UploadCloud } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { db, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, getDoc } from "../../firebase";
import { cn } from "../../utils/cn";
import { uploadToCloudinary, validateFile } from "../../lib/cloudinary";

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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      txs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTransactions(txs);
      setLoading(false);
    });
    getDoc(doc(db, "system_config", "payment_details")).then(snap => {
      if (snap.exists()) setBankDetails(snap.data());
    });
    return () => unsubscribe();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, "image");
    if (err) { setUploadError(err); return; }
    setUploadError("");
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const resetModal = () => {
    setShowAddFunds(false);
    setSubmitSuccess(false);
    setAmount("");
    setProofFile(null);
    setProofPreview("");
    setUploadProgress(0);
    setUploadError("");
    if (abortRef.current) abortRef.current.abort();
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;
    setSubmitting(true);
    setUploadError("");

    let proofUrl = "";
    if (proofFile) {
      try {
        setUploading(true);
        abortRef.current = new AbortController();
        const result = await uploadToCloudinary(
          proofFile,
          (pct) => setUploadProgress(pct),
          "image",
          abortRef.current.signal
        );
        proofUrl = result.secure_url;
      } catch (err: any) {
        if (err?.name === "AbortError") { setSubmitting(false); setUploading(false); return; }
        setUploadError("Image upload failed. You can still submit without proof, or try again.");
        setUploading(false);
        setSubmitting(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    try {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "deposit",
        amount: Number(amount),
        status: "pending",
        description: "Fund Deposit Request",
        proofUrl,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_notifications"), {
        userId: user.uid,
        username: profile?.username,
        type: "payment_review",
        title: "New Deposit Proof",
        message: `${profile?.username} submitted a deposit of $${amount}${proofUrl ? ' with proof attached' : ''}.`,
        read: false,
        createdAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      setTimeout(() => resetModal(), 2200);
    } catch (err) {
      console.error(err);
      setUploadError("Submission failed. Please try again.");
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
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Balance</span>
              </div>
              <h2 className="text-6xl font-black tracking-tighter italic leading-none truncate">
                ${profile?.balance?.toFixed(2) || "0.00"}
              </h2>
            </div>
            <div className="absolute top-0 right-0 w-64 h-full bg-brand-accent/5 skew-x-[45deg] pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-700" />
          </Card>

          <Card className="border shadow-md bg-white dark:bg-slate-900">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest italic mb-6 text-slate-400">Payment Instructions</CardTitle>
            {bankDetails ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5 font-mono text-[10px] dark:text-white uppercase leading-relaxed">
                  <div className="space-y-2">
                    <p className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">Bank:</span> <span className="text-right">{bankDetails.bankName}</span></p>
                    <p className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">Name:</span> <span className="text-right">{bankDetails.accountName}</span></p>
                    <p className="flex justify-between gap-2"><span className="text-slate-500 shrink-0">Account:</span> <span className="text-brand-accent text-right">{bankDetails.accountNumber}</span></p>
                    {bankDetails.reference && <p className="flex justify-between gap-2 border-t border-brand-border pt-2 mt-2"><span className="text-slate-500 shrink-0">REF:</span> <span className="text-right">{bankDetails.reference}</span></p>}
                  </div>
                </div>
                <div className="p-4 border border-brand-accent/20 bg-brand-accent/5 rounded-xl flex gap-3">
                  <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Please transfer the exact amount to avoid delays.</p>
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
                <div className="py-12 text-center opacity-30 italic font-black text-sm uppercase tracking-widest">No transactions yet</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 hover:border-brand-accent/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110",
                        tx.amount > 0 ? "bg-green-500/10 text-brand-success border-green-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        <ArrowUpRight className={cn("w-5 h-5", tx.amount < 0 && "rotate-90")} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{tx.id.slice(0, 8)}</p>
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
                      <p className={cn("text-lg font-black italic tracking-tighter", tx.amount > 0 ? "text-brand-success" : "text-brand-text-bold dark:text-white")}>
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
              <div className="p-6 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></div>
                  <h2 className="text-xl font-black text-brand-text-bold dark:text-white italic uppercase tracking-tighter">Add Funds</h2>
                </div>
                <button onClick={resetModal} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {submitSuccess ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-8 flex flex-col items-center gap-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-brand-success" />
                    <p className="text-sm font-black uppercase tracking-tight text-brand-text-bold dark:text-white">Request submitted!</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Our team will verify your deposit shortly.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleAddFunds} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Deposit Amount ($)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-sm font-black focus:outline-none focus:border-brand-accent transition-all text-brand-text-bold dark:text-white"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        Payment Proof <span className="normal-case font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="proof-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <label
                          htmlFor="proof-upload"
                          className="flex flex-col items-center justify-center w-full h-36 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-brand-border dark:border-white/5 rounded-2xl cursor-pointer hover:border-brand-accent/50 transition-all overflow-hidden group"
                        >
                          {proofPreview ? (
                            <div className="w-full h-full relative">
                              <img src={proofPreview} alt="Proof" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white text-[10px] font-black uppercase">Click to change</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <UploadCloud className="w-8 h-8 text-slate-300 mb-2 group-hover:text-brand-accent transition-colors" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload receipt / screenshot</p>
                              <p className="text-[8px] text-slate-300 mt-1">JPEG, PNG, WebP · Max 10 MB</p>
                            </>
                          )}
                        </label>

                        {uploading && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-brand-accent rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">{uploadProgress}% uploaded</p>
                          </div>
                        )}
                        {uploadError && (
                          <p className="text-[10px] text-red-500 font-bold mt-2">{uploadError}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting || uploading}
                      className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/20"
                    >
                      {(submitting || uploading) ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? `Uploading ${uploadProgress}%` : "Submitting..."}</span>
                      ) : (
                        "Submit Payment Request"
                      )}
                    </Button>

                    <p className="text-[8px] text-center text-slate-500 uppercase font-bold tracking-widest leading-relaxed opacity-60">
                      Your deposit will be verified by our team before your balance is updated.
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
