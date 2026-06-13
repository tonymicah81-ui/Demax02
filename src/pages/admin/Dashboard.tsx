import { useState, useEffect } from "react";
import {
  Users, MessageSquare, AlertCircle, TrendingUp,
  ShieldCheck, Activity, ArrowUpRight, Database,
  Wallet, Loader2
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "motion/react";

interface AuditLog {
  id: string;
  action: string;
  adminId: string;
  createdAt: any;
  targetId?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    pendingFixes: 0,
    pendingDeposits: 0,
    unreadSignals: 0,
    loading: true,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    const unsubFixes = onSnapshot(
      query(collection(db, "fixes"), where("status", "in", ["placed", "under review"])),
      (snap) => setStats(prev => ({ ...prev, pendingFixes: snap.size }))
    );

    const unsubDeposits = onSnapshot(
      query(collection(db, "transactions"), where("type", "==", "deposit"), where("status", "==", "pending")),
      (snap) => setStats(prev => ({ ...prev, pendingDeposits: snap.size }))
    );

    // Fixed: use conversations (not legacy chats)
    const unsubConvos = onSnapshot(
      query(collection(db, "conversations"), where("unreadCount", ">", 0)),
      (snap) => {
        const total = snap.docs.reduce((acc, d) => acc + (d.data().unreadCount || 0), 0);
        setStats(prev => ({ ...prev, unreadSignals: total, loading: false }));
      }
    );

    // Real audit logs
    const unsubLogs = onSnapshot(
      query(collection(db, "audit_logs")),
      (snap) => {
        const logs = snap.docs
          .map(d => ({ id: d.id, ...d.data() })) as AuditLog[];
        // Sort by createdAt descending
        logs.sort((a, b) => {
          const aT = a.createdAt?.seconds || 0;
          const bT = b.createdAt?.seconds || 0;
          return bT - aT;
        });
        setRecentLogs(logs.slice(0, 4));
      }
    );

    return () => {
      unsubUsers();
      unsubFixes();
      unsubDeposits();
      unsubConvos();
      unsubLogs();
    };
  }, []);

  const adminStats = [
    { label: "Active Users", value: stats.users, icon: Users, color: "text-brand-accent", bg: "bg-brand-accent/10" },
    { label: "Pending Fixes", value: stats.pendingFixes, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Unread Messages", value: stats.unreadSignals, icon: MessageSquare, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Pending Deposits", value: stats.pendingDeposits, icon: Wallet, color: "text-brand-success", bg: "bg-brand-success/10" },
  ];

  const formatLogTime = (createdAt: any) => {
    if (!createdAt) return "—";
    if (createdAt?.toDate) return createdAt.toDate().toLocaleTimeString();
    return new Date(createdAt).toLocaleTimeString();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Dashboard</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">
            Platform overview and real-time activity
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
            <span className="text-[10px] font-mono text-white uppercase tracking-widest font-black">All Systems Online</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="hover:border-white/10 transition-all border-none shadow-xl bg-white dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                  <p className="text-4xl font-black text-brand-text-bold dark:text-white italic tracking-tighter">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <CardTitle className="uppercase italic tracking-tighter">Recent Activity</CardTitle>
            <div className="flex items-center gap-2 text-[10px] font-black text-brand-accent">
              <Database className="w-3 h-3" />
              <span>Live</span>
            </div>
          </div>

          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center opacity-30">
                <Activity className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Recent Activity</p>
              </div>
            ) : (
              recentLogs.map((log, i) => (
                <div key={log.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 group hover:border-brand-accent/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-accent transition-colors">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Admin Action</p>
                      <p className="text-sm font-bold text-brand-text-bold dark:text-white uppercase tracking-tight italic">{log.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-400">{formatLogTime(log.createdAt)}</p>
                    <p className="text-[10px] font-black text-brand-success uppercase tracking-widest mt-1">Logged</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 space-y-8">
            <CardTitle className="text-white uppercase italic tracking-tighter">System Health</CardTitle>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform Health</p>
                  <p className="text-2xl font-black italic">Optimal</p>
                </div>
                <TrendingUp className="text-brand-success w-6 h-6" />
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "88.4%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-brand-accent h-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                />
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-brand-success w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Auth_Middleware::Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-brand-success w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Firestore_Grip::Enabled</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-brand-success w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Sessions::Tracked</span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/5 text-[10px]" onClick={() => window.location.href = "/admin/transactions"}>
              View Transactions <ArrowUpRight className="ml-2 w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </Card>
      </div>
    </div>
  );
}
