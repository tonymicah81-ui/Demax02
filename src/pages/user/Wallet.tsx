import { useState, useEffect, useRef } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Wallet, Plus, ArrowUpRight, History, Loader2, Info,
  CheckCircle2, X, UploadCloud, Copy, Check, ChevronRight, ArrowLeft
} from "lucide-react";
import { useAuth } from "../../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { db, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, getDoc } from "../../firebase";
import { cn } from "../../utils/cn";
import { uploadToCloudinary, validateFile } from "../../lib/cloudinary";
import type { BankMethod, CryptoMethod, ThirdPartyMethod, PaymentMethodsDoc } from "../../components/superadmin/PaymentMethodsPanel";
import { PAYMENT_COUNTRIES } from "../../components/superadmin/PaymentMethodsPanel";

interface Transaction {
  id: string;
  type: "deposit" | "payment" | "refund";
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string;
  createdAt: any;
  proofUrl?: string;
  paymentMethodType?: string;
  paymentMethodName?: string;
}

type MethodCategory = "bank" | "crypto" | "thirdParty";
type ModalStep = "method" | "confirm";

interface SelectedMethod {
  category: MethodCategory;
  label: string;
  details: Record<string, string>;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      onClick={copy}
      className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-brand-border dark:border-white/5 cursor-pointer hover:border-brand-accent/40 transition-all group"
    >
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-[12px] font-bold text-brand-text-bold dark:text-white break-all">{value}</p>
      </div>
      <div className="shrink-0 text-slate-300 group-hover:text-brand-accent transition-colors">
        {copied ? <Check className="w-4 h-4 text-brand-success" /> : <Copy className="w-4 h-4" />}
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { profile, user } = useAuth();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("method");
  const [methodCat, setMethodCat] = useState<MethodCategory>("bank");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<SelectedMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsDoc | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
      txs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTransactions(txs);
      setLoading(false);
    });
    getDoc(doc(db, "platform_settings", "payment_methods")).then(snap => {
      if (snap.exists()) setPaymentMethods(snap.data() as PaymentMethodsDoc);
      setLoadingMethods(false);
    }).catch(() => setLoadingMethods(false));
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
    setModalStep("method");
    setMethodCat("bank");
    setSelectedCountry("");
    setSelectedMethod(null);
    setSubmitSuccess(false);
    setAmount("");
    setProofFile(null);
    setProofPreview("");
    setUploadProgress(0);
    setUploadError("");
    if (abortRef.current) abortRef.current.abort();
  };

  const selectBank = (b: BankMethod) => {
    setSelectedMethod({
      category: "bank",
      label: `${b.bankName} (${b.country})`,
      details: {
        "Bank": b.bankName,
        "Account Name": b.accountName,
        "Account Number": b.accountNumber,
        ...(b.sortCode ? { "Sort Code / Routing": b.sortCode } : {}),
        ...(b.note ? { "Note": b.note } : {}),
      },
    });
    setModalStep("confirm");
  };

  const selectCrypto = (c: CryptoMethod) => {
    setSelectedMethod({
      category: "crypto",
      label: `${c.coin} (${c.network})`,
      details: {
        "Coin": c.coin,
        "Network": c.network,
        "Wallet Address": c.address,
        ...(c.note ? { "Note": c.note } : {}),
      },
    });
    setModalStep("confirm");
  };

  const selectTP = (t: ThirdPartyMethod) => {
    setSelectedMethod({
      category: "thirdParty",
      label: t.platform,
      details: {
        "Platform": t.platform,
        "Send To": t.handle,
        ...(t.note ? { "Note": t.note } : {}),
      },
    });
    setModalStep("confirm");
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !selectedMethod) return;
    setSubmitting(true);
    setUploadError("");

    let proofUrl = "";
    if (proofFile) {
      try {
        setUploading(true);
        abortRef.current = new AbortController();
        const result = await uploadToCloudinary(proofFile, (pct) => setUploadProgress(pct), "image", abortRef.current.signal);
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
        paymentMethodType: selectedMethod.category,
        paymentMethodName: selectedMethod.label,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "admin_notifications"), {
        userId: user.uid,
        username: profile?.username,
        type: "payment_review",
        title: "New Deposit Proof",
        message: `${profile?.username} submitted a deposit of $${amount} via ${selectedMethod.label}${proofUrl ? ' with proof attached' : ''}.`,
        read: false,
        createdAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      setTimeout(() => resetModal(), 2400);
    } catch (err) {
      console.error(err);
      setUploadError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBanks = (paymentMethods?.banks || []).filter(b =>
    !selectedCountry || b.country === selectedCountry
  );
  const allCrypto = paymentMethods?.crypto || [];
  const allTP = paymentMethods?.thirdParty || [];

  const hasAnyMethods = (paymentMethods?.banks?.length || 0) + (paymentMethods?.crypto?.length || 0) + (paymentMethods?.thirdParty?.length || 0) > 0;

  const allCatTabs: { id: MethodCategory; label: string; emoji: string; count: number }[] = [
    { id: "bank", label: "Bank Transfer", emoji: "🏦", count: paymentMethods?.banks?.length || 0 },
    { id: "crypto", label: "Crypto", emoji: "₿", count: allCrypto.length },
    { id: "thirdParty", label: "Third Party", emoji: "📲", count: allTP.length },
  ];
  const catTabs = allCatTabs.filter(t => t.count > 0);

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
            <CardTitle className="text-[10px] font-black uppercase tracking-widest italic mb-5 text-slate-400">Payment Methods Available</CardTitle>
            {loadingMethods ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-brand-accent" /></div>
            ) : !hasAnyMethods ? (
              <div className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Admin Config...</div>
            ) : (
              <div className="space-y-2">
                {(paymentMethods?.banks?.length || 0) > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-xl">🏦</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">Bank Transfer</p>
                      <p className="text-[9px] text-slate-400">{paymentMethods!.banks.length} account{paymentMethods!.banks.length > 1 ? 's' : ''} configured</p>
                    </div>
                  </div>
                )}
                {allCrypto.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-xl">₿</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Crypto</p>
                      <p className="text-[9px] text-slate-400">{allCrypto.length} wallet{allCrypto.length > 1 ? 's' : ''} configured</p>
                    </div>
                  </div>
                )}
                {allTP.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                    <span className="text-xl">📲</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-700 dark:text-green-400">Third Party</p>
                      <p className="text-[9px] text-slate-400">{allTP.length} platform{allTP.length > 1 ? 's' : ''} configured</p>
                    </div>
                  </div>
                )}
                <div className="pt-2 flex gap-2 items-start">
                  <Info className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Click "Add Funds" to see payment details and submit your proof.</p>
                </div>
              </div>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-brand-text-bold dark:text-white uppercase tracking-tight italic">{tx.type}</p>
                          {tx.paymentMethodName && (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent">{tx.paymentMethodName}</span>
                          )}
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
              className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/10 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  {modalStep === "confirm" && (
                    <button onClick={() => setModalStep("method")} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-brand-text-bold dark:text-white italic uppercase tracking-tighter">Add Funds</h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      {modalStep === "method" ? "Step 1 — Choose Payment Method" : `Step 2 — ${selectedMethod?.label}`}
                    </p>
                  </div>
                </div>
                <button onClick={resetModal} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {submitSuccess ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-16 flex flex-col items-center gap-4 text-center px-6">
                    <CheckCircle2 className="w-12 h-12 text-brand-success" />
                    <p className="text-sm font-black uppercase tracking-tight text-brand-text-bold dark:text-white">Request submitted!</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Our team will verify your deposit shortly.</p>
                  </motion.div>
                ) : modalStep === "method" ? (
                  <div className="p-6 space-y-5">
                    {loadingMethods ? (
                      <div className="py-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-accent" /></div>
                    ) : catTabs.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">No payment methods configured yet.</p>
                        <p className="text-[10px] text-slate-400 mt-2">Please contact support.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2 flex-wrap">
                          {catTabs.map(t => (
                            <button
                              key={t.id}
                              onClick={() => { setMethodCat(t.id); setSelectedCountry(""); }}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                methodCat === t.id
                                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white'
                              )}
                            >
                              <span>{t.emoji}</span> {t.label}
                            </button>
                          ))}
                        </div>

                        {methodCat === "bank" && (
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Country</label>
                              <select
                                value={selectedCountry}
                                onChange={e => setSelectedCountry(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white cursor-pointer"
                              >
                                <option value="">— Select your country —</option>
                                {PAYMENT_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            {selectedCountry && filteredBanks.length === 0 && (
                              <div className="py-6 text-center text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                No bank accounts configured for {selectedCountry}
                              </div>
                            )}
                            {filteredBanks.map(b => (
                              <button
                                key={b.id}
                                onClick={() => selectBank(b)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 hover:border-brand-accent/40 transition-all text-left group"
                              >
                                <div>
                                  <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">{b.bankName}</p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{b.accountName}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-accent transition-colors shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}

                        {methodCat === "crypto" && (
                          <div className="space-y-3">
                            {allCrypto.map(c => (
                              <button
                                key={c.id}
                                onClick={() => selectCrypto(c)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 hover:border-brand-accent/40 transition-all text-left group"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">₿</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">{c.coin}</p>
                                      <span className="text-[9px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black uppercase">{c.network}</span>
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[200px]">{c.address.slice(0, 20)}...</p>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-accent transition-colors shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}

                        {methodCat === "thirdParty" && (
                          <div className="space-y-3">
                            {allTP.map(t => (
                              <button
                                key={t.id}
                                onClick={() => selectTP(t)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5 hover:border-brand-accent/40 transition-all text-left group"
                              >
                                <div>
                                  <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">{t.platform}</p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.handle}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-accent transition-colors shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleAddFunds} className="p-6 space-y-5">
                    {selectedMethod && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Details <span className="font-normal normal-case text-slate-400">(tap any field to copy)</span></p>
                        <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5">
                          {Object.entries(selectedMethod.details).map(([key, val]) => (
                            key === "Note"
                              ? <div key={key} className="flex items-start gap-2 pt-2 border-t border-brand-border dark:border-white/5">
                                  <Info className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-slate-500 font-bold">{val}</p>
                                </div>
                              : <CopyField key={key} label={key} value={val} />
                          ))}
                        </div>
                        <div className="flex items-start gap-2 px-1">
                          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">Transfer the exact amount shown below to the details above, then upload your payment proof.</p>
                        </div>
                      </div>
                    )}

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
                        <input type="file" id="proof-upload" accept="image/*" className="hidden" onChange={handleFileSelect} />
                        <label
                          htmlFor="proof-upload"
                          className="flex flex-col items-center justify-center w-full h-32 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-brand-border dark:border-white/5 rounded-2xl cursor-pointer hover:border-brand-accent/50 transition-all overflow-hidden group"
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
                              <UploadCloud className="w-7 h-7 text-slate-300 mb-1.5 group-hover:text-brand-accent transition-colors" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload receipt / screenshot</p>
                              <p className="text-[8px] text-slate-300 mt-1">JPEG, PNG, WebP · Max 10 MB</p>
                            </>
                          )}
                        </label>
                        {uploading && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div className="h-full bg-brand-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">{uploadProgress}% uploaded</p>
                          </div>
                        )}
                        {uploadError && <p className="text-[10px] text-red-500 font-bold mt-2">{uploadError}</p>}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting || uploading}
                      className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xl shadow-brand-primary/20"
                    >
                      {(submitting || uploading) ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{uploading ? `Uploading ${uploadProgress}%` : "Submitting..."}</span>
                      ) : "Submit Payment Request"}
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
