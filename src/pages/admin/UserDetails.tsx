import { useState, useEffect } from "react";
import {
  User, Wallet, Activity, Shield, ArrowLeft, Globe, Clock,
  Receipt, Package, Monitor, LogOut, DollarSign, Ban,
  CheckCircle2, Loader2, ChevronRight, AlertCircle, FileText
} from "lucide-react";
import { db, doc, onSnapshot, collection, query, where, orderBy, getDocs, addDoc, updateDoc, serverTimestamp } from "../../firebase";
import { cn } from "../../utils/cn";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../AuthContext";
import { revokeSessionByAdmin } from "../../lib/sessionService";

type Tab = "overview" | "projects" | "transactions" | "orders" | "sessions" | "actions";

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-brand-success/10 text-brand-success",
  approved: "bg-brand-success/10 text-brand-success",
  pending: "bg-amber-500/10 text-amber-500",
  declined: "bg-red-500/10 text-red-500",
  failed: "bg-red-500/10 text-red-500",
};

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Tab data
  const [projects, setProjects] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // Action states
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) setProfile({ uid: snap.id, ...snap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const unsubProjects = onSnapshot(
      query(collection(db, "projects"), where("userId", "==", userId)),
      (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubTx = onSnapshot(
      query(collection(db, "transactions"), where("userId", "==", userId), orderBy("createdAt", "desc")),
      (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc")),
      (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubSessions = onSnapshot(
      query(collection(db, "sessions"), where("userId", "==", userId), where("active", "==", true)),
      (snap) => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubProjects(); unsubTx(); unsubOrders(); unsubSessions(); };
  }, [userId]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !adjustAmount || !adjustReason) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount)) return;

    setAdjusting(true);
    try {
      const userRef = doc(db, "users", userId);
      const newBalance = (profile.balance || 0) + amount;
      await updateDoc(userRef, { balance: Math.max(0, newBalance) });

      await addDoc(collection(db, "transactions"), {
        userId,
        type: "adjustment",
        amount,
        status: "completed",
        description: `Admin adjustment: ${adjustReason}`,
        adminId: currentAdmin?.uid,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "audit_logs"), {
        adminId: currentAdmin?.uid,
        action: `Balance adjusted for ${profile.username}: ${amount > 0 ? "+" : ""}${amount} (${adjustReason})`,
        targetId: userId,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "user_notifications"), {
        userId,
        title: "Balance Adjusted",
        message: `Your balance has been ${amount > 0 ? "increased" : "decreased"} by $${Math.abs(amount).toFixed(2)}. Reason: ${adjustReason}`,
        read: false,
        createdAt: serverTimestamp(),
      });

      setAdjustAmount("");
      setAdjustReason("");
      alert("Balance updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed: " + err);
    } finally {
      setAdjusting(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!userId || !profile) return;
    setSuspending(true);
    const newStatus = profile.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
      await addDoc(collection(db, "audit_logs"), {
        adminId: currentAdmin?.uid,
        action: `Account ${newStatus === "inactive" ? "suspended" : "reactivated"}: ${profile.username}`,
        targetId: userId,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "user_notifications"), {
        userId,
        title: newStatus === "inactive" ? "Account Suspended" : "Account Reactivated",
        message: newStatus === "inactive"
          ? "Your account has been suspended. Contact support for details."
          : "Your account has been reactivated. Welcome back.",
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSuspending(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!currentAdmin) return;
    setRevoking(sessionId);
    try {
      await revokeSessionByAdmin(sessionId, currentAdmin.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="p-10 text-center">
      <p>Entity not found.</p>
      <Button onClick={() => navigate(-1)} className="mt-4">Return</Button>
    </div>
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "projects", label: "Projects", count: projects.length },
    { key: "transactions", label: "Transactions", count: transactions.length },
    { key: "orders", label: "Orders", count: orders.length },
    { key: "sessions", label: "Sessions", count: sessions.length },
    { key: "actions", label: "Admin Actions" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-brand-accent transition-all shadow-sm"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Entity_Intel</h1>
          <p className="text-brand-accent font-black mt-1 uppercase tracking-[0.2em] text-[10px] italic">
            Deep Dossier // {profile.email}
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden">
        <div className="h-24 bg-brand-primary relative">
          <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-[24px] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center">
            <User className="w-10 h-10 text-slate-300" />
          </div>
        </div>
        <div className="px-8 pt-14 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">{profile.username}</h2>
            <p className="text-xs font-mono text-slate-400 lowercase mt-0.5">{profile.uid}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                profile.status === "active" ? "bg-brand-success/10 text-brand-success" : "bg-red-500/10 text-red-500"
              )}>
                {profile.status}
              </span>
              <span className="px-3 py-1 rounded-lg bg-brand-accent/10 text-brand-accent text-[9px] font-black uppercase tracking-widest">
                {profile.role}
              </span>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
              <p className="text-2xl font-black text-brand-success italic">${profile.balance?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Projects</p>
              <p className="text-2xl font-black text-brand-accent italic">{projects.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orders</p>
              <p className="text-2xl font-black text-brand-text-bold dark:text-white italic">{orders.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2",
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 text-brand-text-bold dark:text-white shadow-sm"
                : "text-slate-500 hover:text-brand-text-bold dark:hover:text-white"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-brand-accent text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {tab.count > 9 ? "9+" : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="space-y-4">
                <CardTitle className="uppercase italic tracking-tighter">Identity Details</CardTitle>
                {[
                  { label: "Email", value: profile.email },
                  { label: "Phone", value: profile.phoneNumber || "—" },
                  { label: "Joined", value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—" },
                  { label: "Balance", value: `$${profile.balance?.toFixed(2) || "0.00"}` },
                  { label: "Status", value: profile.status },
                  { label: "Role", value: profile.role },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-brand-border dark:border-white/5 last:border-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                    <span className="text-xs font-bold text-brand-text-bold dark:text-white">{row.value}</span>
                  </div>
                ))}
              </Card>
              <Card className="space-y-4">
                <CardTitle className="uppercase italic tracking-tighter">Quick Stats</CardTitle>
                {[
                  { label: "Total Projects", value: projects.length, icon: Globe },
                  { label: "Total Transactions", value: transactions.length, icon: Wallet },
                  { label: "Total Orders", value: orders.length, icon: Package },
                  { label: "Active Sessions", value: sessions.length, icon: Monitor },
                  { label: "Total Spent", value: `$${orders.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}`, icon: DollarSign },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-brand-border dark:border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <row.icon className="w-4 h-4 text-brand-accent" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                    </div>
                    <span className="text-xs font-black text-brand-text-bold dark:text-white">{row.value}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="py-24 text-center opacity-30">
                  <Globe className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No Projects</p>
                </div>
              ) : projects.map((p) => (
                <Card key={p.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-brand-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">{p.name}</h3>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{p.status}</span>
                        </div>
                        <div className="flex gap-4 text-[10px] font-mono text-slate-400 uppercase">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.expiryDate ? new Date(p.expiryDate.seconds * 1000).toLocaleDateString() : "No Expiry"}</span>
                          <span>{p.domainName || "No Domain"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="py-24 text-center opacity-30">
                  <Wallet className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No Transactions</p>
                </div>
              ) : transactions.map((tx) => (
                <Card key={tx.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                        tx.type === "deposit" ? "bg-brand-success/10 text-brand-success"
                        : tx.type === "refund" ? "bg-amber-500/10 text-amber-500"
                        : "bg-brand-accent/10 text-brand-accent"
                      )}>
                        {tx.type === "deposit" ? "+" : tx.type === "refund" ? "R" : "-"}
                      </div>
                      <div>
                        <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">{tx.description || tx.type}</p>
                        <div className="flex gap-3 text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                          <span>{tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : "—"}</span>
                          <span className={cn("font-black", STATUS_STYLE[tx.status] || "")}>{tx.status}</span>
                        </div>
                      </div>
                    </div>
                    <p className={cn("text-sm font-black italic",
                      tx.amount > 0 ? "text-brand-success" : "text-red-500"
                    )}>
                      {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="py-24 text-center opacity-30">
                  <Package className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No Orders</p>
                </div>
              ) : orders.map((order) => (
                <Card key={order.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-brand-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                            {order.items?.length || 0} item(s)
                          </p>
                          <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full", STATUS_STYLE[order.status] || "")}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">{order.receiptNumber} · {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "—"}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-brand-success italic">${order.total?.toFixed(2)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* SESSIONS */}
          {activeTab === "sessions" && (
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="py-24 text-center opacity-30">
                  <Monitor className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No Active Sessions</p>
                </div>
              ) : sessions.map((session) => (
                <Card key={session.id} className="border-none bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                          {session.deviceInfo?.includes("Mobile") ? "Mobile" : "Desktop"}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">
                          Expires: {new Date(session.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="gap-1.5 text-[10px] border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      {revoking === session.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                      Revoke
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ADMIN ACTIONS */}
          {activeTab === "actions" && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="space-y-6">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-brand-success" /> Adjust Balance
                </CardTitle>
                <form onSubmit={handleAdjustBalance} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Amount (use – for deduction)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={adjustAmount}
                      onChange={e => setAdjustAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-brand-accent transition-all"
                      placeholder="e.g. 50.00 or -25.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Reason</label>
                    <input
                      type="text"
                      required
                      value={adjustReason}
                      onChange={e => setAdjustReason(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-brand-accent transition-all"
                      placeholder="Refund, bonus, correction..."
                    />
                  </div>
                  <Button type="submit" disabled={adjusting} className="w-full gap-2 text-[10px] bg-brand-success hover:bg-green-600 text-white">
                    {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                    Apply Adjustment
                  </Button>
                </form>
              </Card>

              <Card className="space-y-6">
                <CardTitle className="uppercase italic tracking-tighter flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-accent" /> Account Control
                </CardTitle>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Status</p>
                    <p className={cn("text-sm font-black uppercase tracking-tight",
                      profile.status === "active" ? "text-brand-success" : "text-red-500"
                    )}>
                      {profile.status === "active" ? "● Active" : "● Suspended"}
                    </p>
                  </div>

                  <Button
                    onClick={handleToggleSuspend}
                    disabled={suspending}
                    className={cn(
                      "w-full gap-2 text-[10px]",
                      profile.status === "active"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-brand-success hover:bg-green-600 text-white"
                    )}
                  >
                    {suspending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : profile.status === "active"
                        ? <><Ban className="w-4 h-4" /> Suspend Account</>
                        : <><CheckCircle2 className="w-4 h-4" /> Reactivate Account</>
                    }
                  </Button>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase leading-relaxed">
                      Suspending will prevent the user from accessing any protected routes. They will be notified.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
