import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Search,
  User as UserIcon,
  TrendingUp,
  History,
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { db, collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, runTransaction, addDoc, orderBy } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";
import { logAudit } from "../../lib/audit";

interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  proofUrl: string;
  createdAt: any;
  description: string;
}

export default function ManagePayments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const qPending = query(collection(db, "transactions"), where("status", "==", "pending"), where("type", "==", "deposit"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
      setLoading(false);
    });

    const qHistory = query(collection(db, "transactions"), where("status", "in", ["completed", "failed"]), orderBy("createdAt", "desc"));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);

      const total = snapshot.docs
        .filter(d => d.data().status === "completed")
        .reduce((sum, d) => sum + (d.data().amount || 0), 0);
      setTotalDeposits(total);
    });

    return () => {
      unsubPending();
      unsubHistory();
    };
  }, []);

  const handleAction = async (payment: PaymentRecord, action: "approve" | "reject") => {
    setProcessingId(payment.id);
    try {
      if (action === "approve") {
        await runTransaction(db, async (tx) => {
          const userRef = doc(db, "users", payment.userId);
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists()) throw "User not found";

          const currentBalance = userDoc.data().balance || 0;
          const newBalance = currentBalance + payment.amount;

          tx.update(userRef, { balance: newBalance });
          tx.update(doc(db, "transactions", payment.id), {
            status: "completed",
            verifiedAt: serverTimestamp(),
            adminId: user?.uid
          });

          const notifRef = doc(collection(db, "user_notifications"));
          tx.set(notifRef, {
            userId: payment.userId,
            title: "Deposit Approved",
            message: `Your deposit of $${payment.amount.toFixed(2)} has been approved and added to your wallet.`,
            read: false,
            createdAt: serverTimestamp()
          });
        });
        logAudit(user as any, "PAYMENT_APPROVED", `Approved $${payment.amount} for user ${payment.userId}`, payment.id, "transaction");
      } else {
        await updateDoc(doc(db, "transactions", payment.id), {
          status: "failed",
          rejectedAt: serverTimestamp(),
          adminId: user?.uid
        });

        await addDoc(collection(db, "user_notifications"), {
          userId: payment.userId,
          title: "Deposit Rejected",
          message: `Your deposit of $${payment.amount.toFixed(2)} could not be verified. Please contact support.`,
          read: false,
          createdAt: serverTimestamp()
        });
        logAudit(user as any, "PAYMENT_REJECTED", `Rejected $${payment.amount} for user ${payment.userId}`, payment.id, "transaction");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredHistory = history.filter(h =>
    h.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Payments</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Review and approve client payment requests
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("pending")}
            className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest", activeTab === "pending" ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" : "text-slate-400")}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest", activeTab === "history" ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" : "text-slate-400")}
          >
            History
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 bg-brand-primary text-white border-none shadow-2xl space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Approved Deposits</p>
            <p className="text-4xl font-black italic tracking-tighter">${totalDeposits.toLocaleString()}</p>
          </div>
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase opacity-60">Awaiting Review</span>
              <span className="text-xl font-black italic">{payments.length}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[9px] font-bold uppercase">Processed</span>
              <span className="text-xl font-black italic">{history.length}</span>
            </div>
          </div>
          <div className="pt-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-accent" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Live Data</p>
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === "pending" ? (
            <div className="grid gap-4">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading payments...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 border border-dashed border-brand-border rounded-3xl opacity-30">
                  <ShieldCheck className="w-12 h-12 text-slate-400" />
                  <p className="text-sm font-black uppercase tracking-widest italic">All caught up</p>
                </div>
              ) : (
                payments.map((p) => (
                  <Card key={p.id} className="group hover:border-brand-accent/30 transition-all border-none bg-white dark:bg-slate-900 shadow-md">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-2">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-brand-border dark:border-white/5 shadow-sm overflow-hidden shrink-0">
                          <UserIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">Deposit #{p.id.slice(0, 8)}</h3>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded truncate">UID: {p.userId}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            <span className="flex items-center gap-1 text-brand-success"><Clock className="w-3 h-3" /> Awaiting Review</span>
                            <span className="opacity-40 italic">{p.createdAt?.toDate().toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-2xl font-black text-brand-text-bold dark:text-white italic tracking-tighter">${p.amount.toFixed(2)}</p>
                          <button onClick={() => setViewProof(p.proofUrl)} className="text-[9px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-1 hover:underline mt-1"><ExternalLink className="w-3 h-3" /> View Proof</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAction(p, "reject")} disabled={processingId === p.id} className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all"><XCircle className="w-5 h-5" /></button>
                          <button onClick={() => handleAction(p, "approve")} disabled={processingId === p.id} className="h-12 px-6 bg-brand-success hover:bg-green-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl flex items-center gap-2">
                            {processingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card className="space-y-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase italic tracking-tighter">Payment History</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ID or user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 bg-slate-100 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:border-brand-accent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredHistory.map(h => (
                  <div key={h.id} className="p-4 rounded-xl border border-brand-border dark:border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", h.status === 'completed' ? "bg-brand-success/10 text-brand-success" : "bg-red-500/10 text-red-500")}>
                        {h.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-brand-text-bold dark:text-white uppercase italic tracking-tighter">{h.status === 'completed' ? 'Approved' : 'Rejected'} Deposit</p>
                        <p className="text-[8px] font-mono text-slate-400">ID: {h.id} · User: {h.userId.slice(0, 10)}...</p>
                      </div>
                    </div>
                    <p className={cn("text-lg font-black italic tracking-tighter", h.status === 'completed' ? "text-brand-success" : "text-red-500")}>${h.amount}</p>
                  </div>
                ))}
                {filteredHistory.length === 0 && (
                  <div className="py-20 text-center opacity-20">
                    <History className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No payment history</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewProof && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-6" onClick={() => setViewProof(null)}>
            <div className="relative max-w-4xl w-full h-[80vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <img src={viewProof} className="w-full h-full object-contain" alt="Payment proof" />
              <button onClick={() => setViewProof(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">✕</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
