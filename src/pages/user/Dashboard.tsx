import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers, MessageSquare, Bell, ArrowUpRight,
  Activity, ShieldCheck, Globe, Loader2, Clock, Wrench,
  AlertCircle, Wallet, CheckCircle2
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { db, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from "../../firebase";

interface Project {
  id: string;
  name: string;
  domainName?: string;
  status: string;
  expiryDate?: any;
  createdAt: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function UserDashboard() {
  const { profile, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFixModal, setShowFixModal] = useState<{ projectId: string; projectName: string } | null>(null);
  const [fixDescription, setFixDescription] = useState("");
  const [submittingFix, setSubmittingFix] = useState(false);
  const [fixSuccess, setFixSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubProjects = onSnapshot(
      query(collection(db, "projects"), where("userId", "==", user.uid)),
      (snap) => {
        setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
        setLoading(false);
      }
    );

    const unsubNotifs = onSnapshot(
      query(
        collection(db, "user_notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(3)
      ),
      (snap) => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[]);
      }
    );

    const unsubConvos = onSnapshot(
      query(collection(db, "conversations"), where("userId", "==", user.uid)),
      (snap) => {
        const total = snap.docs.reduce((acc, d) => acc + (d.data().unreadCount || 0), 0);
        setUnreadMessages(total);
      }
    );

    return () => { unsubProjects(); unsubNotifs(); unsubConvos(); };
  }, [user]);

  const handlePlaceFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showFixModal || !fixDescription.trim()) return;
    setSubmittingFix(true);
    try {
      await addDoc(collection(db, "fixes"), {
        userId: user.uid,
        projectId: showFixModal.projectId,
        description: fixDescription,
        status: "placed",
        createdAt: serverTimestamp(),
      });
      setFixSuccess(true);
      setFixDescription("");
      setTimeout(() => {
        setFixSuccess(false);
        setShowFixModal(null);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFix(false);
    }
  };

  const stats = [
    { label: "Active Projects", value: loading ? "—" : projects.length.toString().padStart(2, "0"), icon: Layers, color: "text-brand-accent", bg: "bg-brand-accent/10" },
    { label: "Security Status", value: "Verified", icon: ShieldCheck, color: "text-brand-success", bg: "bg-brand-success/10" },
    { label: "Unread Messages", value: unreadMessages > 0 ? unreadMessages.toString().padStart(2, "0") : "00", icon: MessageSquare, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Wallet Balance", value: `$${profile?.balance?.toFixed(0) || "0"}`, icon: Wallet, color: "text-brand-primary", bg: "bg-brand-primary/10" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">
            Welcome, <span className="text-brand-accent">{profile?.username || "User"}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">
            Your dashboard overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none mb-1">Current Time</p>
            <p className="text-xs font-mono text-brand-text-bold dark:text-white uppercase italic">{new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}</p>
          </div>
          <Button size="sm" className="hidden lg:flex" onClick={() => window.location.href = '/store'}>Browse Store</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                  <p className="text-3xl font-black text-brand-text-bold dark:text-white italic tracking-tighter">{stat.value}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <span className="absolute -bottom-4 -right-2 text-7xl font-black text-slate-100 dark:text-white opacity-[0.03] italic pointer-events-none select-none">0{i + 1}</span>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle className="uppercase italic tracking-tighter">My Projects</CardTitle>
            <span className="text-[10px] font-black uppercase text-slate-400">
              Total: {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="h-64 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-white/5 space-y-4">
                <Activity className="text-slate-300 w-12 h-12 animate-pulse" />
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">No projects yet</p>
                  <p className="text-xs text-slate-300 dark:text-slate-700 font-medium max-w-xs mt-1">Contact our team to get your first project started.</p>
                </div>
              </div>
            ) : (
              projects.map((p) => (
                <Card key={p.id} className="group hover:border-brand-accent/30 transition-all border-none bg-white dark:bg-slate-900 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-brand-border dark:border-white/5 transition-colors group-hover:bg-brand-accent group-hover:text-white group-hover:border-brand-accent shadow-sm relative overflow-hidden">
                        <Globe className="w-6 h-6 z-10" />
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white/5 skew-x-[45deg]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <h3 className="text-lg font-bold text-brand-text-bold dark:text-white uppercase tracking-tight italic">{p.name}</h3>
                          <span className={cn(
                            "text-[8px] font-black uppercase py-0.5 px-2 rounded-full",
                            p.status === "delivered" ? "bg-brand-success/10 text-brand-success" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expiry: {p.expiryDate ? new Date(p.expiryDate.seconds * 1000).toLocaleDateString() : "N/A"}</span>
                          <span className="flex items-center gap-1 italic">{p.domainName || "No domain assigned"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {p.status === "delivered" ? (
                        <Button
                          onClick={() => setShowFixModal({ projectId: p.id, projectName: p.name })}
                          className="bg-amber-500 hover:bg-amber-600 text-white gap-2 text-[10px] h-10 px-6 shadow-lg shadow-amber-500/20"
                        >
                          <Wrench className="w-3 h-3" /> Report Issue
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-10 px-6 uppercase text-[9px] tracking-widest">View Progress</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle className="uppercase italic tracking-tighter">Recent Notifications</CardTitle>
            <div className="w-2 h-2 rounded-full bg-brand-success shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
          </div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="py-8 text-center opacity-30">
                <Bell className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={cn(
                  "flex gap-4 p-4 rounded-xl border group cursor-pointer hover:border-brand-accent/30 transition-all",
                  notif.read
                    ? "bg-slate-50 dark:bg-slate-950 border-brand-border dark:border-white/5"
                    : "bg-brand-accent/5 border-brand-accent/20"
                )}>
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-accent transition-colors shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-brand-text-bold dark:text-white truncate uppercase tracking-tight">{notif.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button variant="outline" className="w-full text-[10px]" onClick={() => window.location.href = "/notifications"}>View Notifications</Button>
        </Card>
      </div>

      <AnimatePresence>
        {showFixModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Wrench className="text-amber-500 w-5 h-5" />
                  <h2 className="text-xl font-black text-brand-text-bold dark:text-white italic uppercase tracking-tighter">Submit Fix Request</h2>
                </div>
                <button onClick={() => { setShowFixModal(null); setFixDescription(""); setFixSuccess(false); }} className="text-slate-400 hover:text-white transition-colors">✕</button>
              </div>

              <form onSubmit={handlePlaceFix} className="p-8 space-y-6">
                {fixSuccess ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-8 flex flex-col items-center gap-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-brand-success" />
                    <p className="text-sm font-black uppercase tracking-tight text-brand-text-bold dark:text-white">Request submitted!</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Our team will review it shortly.</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase leading-relaxed">
                        Describe the issue with <span className="text-brand-text-bold dark:text-white">"{showFixModal.projectName}"</span>. Our team will review and prioritize.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Issue Description</label>
                      <textarea
                        required
                        value={fixDescription}
                        onChange={(e) => setFixDescription(e.target.value)}
                        className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold text-brand-text-bold dark:text-white focus:outline-none focus:border-brand-accent transition-all resize-none"
                        placeholder="Describe your issue..."
                      />
                    </div>
                    <Button type="submit" disabled={submittingFix} className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20">
                      {submittingFix ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Request"}
                    </Button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between py-6 px-10 bg-brand-primary dark:bg-slate-900 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Professional Expansion</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium italic">Transform your static vision into a fully functional empire.</p>
          </div>
          <Button variant="primary" className="bg-brand-success dark:bg-brand-success hover:bg-green-600 text-white shadow-xl shadow-green-500/20" onClick={() => window.location.href = "/store"}>
            Browse Store <ArrowUpRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[45deg] transition-all duration-700 group-hover:translate-x-20" />
      </div>
    </div>
  );
}
