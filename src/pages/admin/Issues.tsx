import { useState, useEffect } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { AlertCircle, Clock, CheckCircle2, Search, Loader2, Filter } from "lucide-react";
import { motion } from "motion/react";
import { db, collection, query, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, orderBy } from "../../firebase";

interface Issue {
  id: string;
  userId: string;
  projectId: string;
  description: string;
  status: "placed" | "under review" | "fix in progress" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: any;
  updatedAt?: any;
}

const STATUS_CONFIG = {
  placed: { label: "Placed", color: "bg-amber-500/10 text-amber-500" },
  "under review": { label: "Under Review", color: "bg-brand-accent/10 text-brand-accent" },
  "fix in progress": { label: "In Progress", color: "bg-brand-primary/10 text-brand-primary" },
  completed: { label: "Completed", color: "bg-brand-success/10 text-brand-success" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-slate-100 dark:bg-slate-800 text-slate-500" },
  medium: { label: "Medium", color: "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" },
  high: { label: "High", color: "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" },
  critical: { label: "Critical", color: "bg-red-600 text-white" },
};

export default function AdminIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "fixes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Issue[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (issue: Issue, newStatus: Issue["status"]) => {
    setUpdatingId(issue.id);
    try {
      await updateDoc(doc(db, "fixes", issue.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      await addDoc(collection(db, "user_notifications"), {
        userId: issue.userId,
        title: "Issue Status Updated",
        message: `Your reported issue has been updated to: ${STATUS_CONFIG[newStatus].label}.`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = issues.filter(i => {
    const matchesStatus = filterStatus === "all" || i.status === filterStatus;
    const matchesSearch = !search || i.description.toLowerCase().includes(search.toLowerCase()) || i.userId.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: issues.length,
    placed: issues.filter(i => i.status === "placed").length,
    "under review": issues.filter(i => i.status === "under review").length,
    "fix in progress": issues.filter(i => i.status === "fix in progress").length,
    completed: issues.filter(i => i.status === "completed").length,
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Support Issues</h1>
          <p className="text-red-500 font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Review and resolve client-reported project issues
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-medium focus:outline-none focus:border-brand-accent transition-all w-72 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          ["all", "All"],
          ["placed", "Placed"],
          ["under review", "Under Review"],
          ["fix in progress", "In Progress"],
          ["completed", "Completed"],
        ] as [string, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
              filterStatus === val ? "bg-brand-accent text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {label} ({counts[val as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading issues...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4 border border-dashed border-brand-border dark:border-white/5 rounded-3xl opacity-30">
            <CheckCircle2 className="w-12 h-12 text-slate-400" />
            <p className="text-sm font-black uppercase tracking-widest italic">
              {issues.length === 0 ? "No issues reported" : "No issues match this filter"}
            </p>
          </div>
        ) : (
          filtered.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="hover:border-brand-accent/30 transition-all border-none bg-white dark:bg-slate-900 shadow-md group">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                      issue.status === "completed"
                        ? "bg-green-50 dark:bg-green-950/20 text-brand-success border-green-100 dark:border-green-900/30"
                        : "bg-amber-50 dark:bg-amber-950/20 text-amber-500 border-amber-100 dark:border-amber-900/30"
                    )}>
                      {issue.status === "completed"
                        ? <CheckCircle2 className="w-5 h-5" />
                        : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", STATUS_CONFIG[issue.status].color)}>
                          {STATUS_CONFIG[issue.status].label}
                        </span>
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", PRIORITY_CONFIG[issue.priority || "medium"].color)}>
                          {PRIORITY_CONFIG[issue.priority || "medium"].label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">#{issue.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic line-clamp-2">
                        {issue.description}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        User: {issue.userId.slice(0, 12)}... · {issue.createdAt ? new Date(issue.createdAt.seconds * 1000).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update Status</p>
                      <div className="flex gap-1">
                        {(["placed", "under review", "fix in progress", "completed"] as Issue["status"][]).map(st => (
                          <button
                            key={st}
                            disabled={updatingId === issue.id}
                            onClick={() => updateStatus(issue, st)}
                            title={STATUS_CONFIG[st].label}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2 text-[8px] font-black",
                              issue.status === st
                                ? "bg-brand-accent border-brand-accent text-white"
                                : "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:border-brand-accent/40"
                            )}
                          >
                            {st === "placed" && <Clock className="w-3.5 h-3.5" />}
                            {st === "under review" && <Search className="w-3.5 h-3.5" />}
                            {st === "fix in progress" && <Loader2 className={cn("w-3.5 h-3.5", updatingId === issue.id ? "animate-spin" : "")} />}
                            {st === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
