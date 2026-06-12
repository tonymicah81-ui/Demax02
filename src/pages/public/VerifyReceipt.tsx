import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, XCircle, Loader2, ArrowLeft, Receipt } from "lucide-react";
import { motion } from "motion/react";
import { db, collection, query, where, getDocs } from "../../firebase";
import { Logo } from "../../components/ui/Logo";

export default function VerifyReceipt() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "found" | "not_found">("loading");
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    if (!receiptNumber) return;
    const q = query(collection(db, "receipts"), where("receiptNumber", "==", receiptNumber));
    getDocs(q).then((snap) => {
      if (!snap.empty) {
        setReceipt(snap.docs[0].data());
        setStatus("found");
      } else {
        setStatus("not_found");
      }
    });
  }, [receiptNumber]);

  const maskName = (name: string) => {
    if (!name || name.length < 2) return "***";
    return name[0] + "*".repeat(Math.min(name.length - 1, 4));
  };

  const maskEmail = (email: string) => {
    if (!email) return "***";
    const [user, domain] = email.split("@");
    return user[0] + "***@" + domain;
  };

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex flex-col">
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-brand-border dark:border-white/5 h-16 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={() => navigate("/")}
            className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-accent transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center pt-16 px-6">
        <div className="max-w-md w-full">
          {status === "loading" && (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-brand-accent mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Receipt...</p>
            </div>
          )}

          {status === "not_found" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/30 shadow-2xl overflow-hidden text-center"
            >
              <div className="bg-red-50 dark:bg-red-950/30 p-12 border-b border-red-100 dark:border-red-900/30">
                <XCircle className="w-20 h-20 text-red-500 mx-auto" />
              </div>
              <div className="p-10 space-y-4">
                <h1 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Not Found</h1>
                <p className="text-sm text-slate-500 font-medium">
                  Receipt <span className="font-black text-brand-text-bold dark:text-white font-mono">{receiptNumber}</span> could not be verified in our system.
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">This receipt may be invalid, expired, or does not exist.</p>
              </div>
            </motion.div>
          )}

          {status === "found" && receipt && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-success/30 shadow-2xl overflow-hidden"
            >
              <div className="bg-brand-success/10 p-10 border-b border-brand-success/20 text-center">
                <ShieldCheck className="w-20 h-20 text-brand-success mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-success">Authentic Receipt</p>
                <h2 className="text-3xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic mt-2">VERIFIED</h2>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt Number</span>
                  <span className="text-xs font-mono font-black text-brand-accent">{receipt.receiptNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued To</span>
                  <span className="text-xs font-black text-brand-text-bold dark:text-white">{maskName(receipt.username)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                  <span className="text-xs font-mono text-slate-500">{maskEmail(receipt.userEmail || "")}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-xl font-black text-brand-success italic">${receipt.total?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</span>
                  <span className="text-xs font-black text-brand-text-bold dark:text-white">{receipt.items?.length || 0} product(s)</span>
                </div>

                {receipt.issuedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                    <span className="text-xs font-mono text-slate-500">
                      {receipt.issuedAt?.toDate
                        ? receipt.issuedAt.toDate().toLocaleDateString()
                        : new Date(receipt.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="pt-6 border-t border-brand-border dark:border-white/5 flex items-center justify-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <Receipt className="w-3 h-3" />
                  Issued by Durex Team Platform
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
