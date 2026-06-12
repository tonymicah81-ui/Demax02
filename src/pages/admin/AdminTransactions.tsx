import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Wallet, Search, Filter, Loader2, ArrowUpRight, ArrowDownLeft,
  RefreshCw, ChevronRight, Users, TrendingUp, Clock
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { db, collection, query, where, onSnapshot, orderBy, getDocs } from "../../firebase";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "payment" | "refund" | "adjustment";
  amount: number;
  status: "pending" | "completed" | "approved" | "declined" | "failed";
  description: string;
  createdAt: any;
  orderId?: string;
  receiptNumber?: string;
}

interface UserMap { [uid: string]: { username: string; email: string }; }

const TYPE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  deposit:    { color: "text-brand-success", bg: "bg-brand-success/10", label: "Deposit" },
  payment:    { color: "text-brand-accent",  bg: "bg-brand-accent/10",  label: "Payment" },
  refund:     { color: "text-amber-500",     bg: "bg-amber-500/10",     label: "Refund" },
  adjustment: { color: "text-slate-500",     bg: "bg-slate-500/10",     label: "Adjust" },
};
const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-500/10 text-amber-500",
  completed: "bg-brand-success/10 text-brand-success",
  approved:  "bg-brand-success/10 text-brand-success",
  declined:  "bg-red-500/10 text-red-500",
  failed:    "bg-red-500/10 text-red-500",
};

export default function AdminTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "payment" | "refund">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, volume: 0 });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "transactions"), orderBy("createdAt", "desc")),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
        setTransactions(data);

        const pending = data.filter(t => t.status === "pending").length;
        const volume = data
          .filter(t => (t.status === "completed" || t.status === "approved") && t.amount > 0)
          .reduce((s, t) => s + t.amount, 0);
        setStats({ total: data.length, pending, volume });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    getDocs(collection(db, "users")).then(snap => {
      const map: UserMap = {};
      snap.docs.forEach(d => {
        map[d.id] = { username: d.data().username, email: d.data().email };
      });
      setUsers(map);
    });
  }, []);

  const filtered = transactions.filter(t => {
    const matchTab = activeTab === "all" || t.type === activeTab;
    const user = users[t.userId];
    const matchSearch = !searchQuery ||
      t.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "deposit", label: "Deposits" },
    { key: "payment", label: "Payments" },
    { key: "refund", label: "Refunds" },
  ];

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">All Transactions</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Platform Ledger // {filtered.length} of {transactions.length} Records
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: "Total Records", value: stats.total.toString(), icon: Filter, color: "text-brand-accent", bg: "bg-brand-accent/10" },
          { label: "Pending Review", value: stats.pending.toString(), icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Platform Volume", value: `$${stats.volume.toFixed(2)}`, icon: TrendingUp, color: "text-brand-success", bg: "bg-brand-success/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-none bg-white dark:bg-slate-900 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                  <p className="text-3xl font-black text-brand-text-bold dark:text-white italic tracking-tighter">{stat.value}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-none bg-white dark:bg-slate-900 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab.key
                    ? "bg-white dark:bg-slate-900 text-brand-text-bold dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-brand-text-bold dark:hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user / ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all w-64"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="py-16 text-center opacity-30">
              <Wallet className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">No Transactions Found</p>
            </div>
          ) : (
            filtered.slice(0, 50).map((tx) => {
              const typeInfo = TYPE_STYLE[tx.type] || TYPE_STYLE.deposit;
              const userInfo = users[tx.userId];
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 hover:border-brand-accent/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeInfo.bg, typeInfo.color)}>
                      {tx.amount < 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                          {userInfo?.username || tx.userId.slice(0, 8)}
                        </p>
                        <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full", typeInfo.bg, typeInfo.color)}>
                          {typeInfo.label}
                        </span>
                        <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full", STATUS_STYLE[tx.status] || "")}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        {userInfo?.email || ""} · {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn("text-sm font-black italic", tx.amount < 0 ? "text-red-500" : "text-brand-success")}>
                        {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/users/${tx.userId}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-brand-accent"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
          {filtered.length > 50 && (
            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">
              Showing 50 of {filtered.length} — use search to filter
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
