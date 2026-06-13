import { useState, useEffect } from "react";
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Search,
  LayoutDashboard,
  MessageSquare,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { db, collection, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy } from "../../firebase";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";

interface Fix {
  id: string;
  userId: string;
  projectId: string;
  description: string;
  status: "placed" | "under review" | "fix in progress" | "completed";
  createdAt: any;
  projectName?: string;
}

export default function ManageFixes() {
  const [fixes, setFixes] = useState<Fix[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "fixes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFixes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Fix[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (fixId: string, userId: string, newStatus: Fix['status']) => {
    setUpdatingId(fixId);
    try {
      await updateDoc(doc(db, "fixes", fixId), { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });
      
      // Notify User
      await addDoc(collection(db, "user_notifications"), {
        userId: userId,
        title: "Fix Status Updated",
        message: `Your project fix status has been updated to: ${newStatus.toUpperCase()}.`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredFixes = filter === "all" ? fixes : fixes.filter(f => f.status === filter);

  const statuses: Fix['status'][] = ["placed", "under review", "fix in progress", "completed"];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Support Fixes</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Review and resolve client-reported project issues
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl overflow-x-auto max-w-full">
           {["all", ...statuses].map((s) => (
             <button
               key={s}
               onClick={() => setFilter(s)}
               className={cn(
                 "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                 filter === s ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
               {s}
             </button>
           ))}
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading fixes...</p>
          </div>
        ) : filteredFixes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4 border border-dashed border-brand-border rounded-3xl opacity-30">
             <CheckCircle2 className="w-12 h-12 text-slate-400" />
             <p className="text-sm font-black uppercase tracking-widest italic">All issues resolved</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredFixes.map((f) => (
              <Card key={f.id} className="group hover:border-brand-accent/30 transition-all border-none bg-white dark:bg-slate-900 shadow-md">
                 <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-2">
                    <div className="flex items-center gap-6 flex-1">
                       <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-brand-border dark:border-white/5 shadow-sm relative overflow-hidden">
                          <Wrench className="w-6 h-6 text-amber-500" />
                          <div className="absolute inset-0 bg-amber-500 opacity-[0.03] animate-pulse" />
                       </div>
                       <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1 text-slate-400 font-mono text-[10px] uppercase">
                             <span>FIX_ID: {f.id.slice(0, 8)}</span>
                             <ChevronRight className="w-3 h-3" />
                             <span>USER: {f.userId.slice(0, 8)}</span>
                          </div>
                          <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic truncate">
                             {f.description.slice(0, 80)}{f.description.length > 80 ? '...' : ''}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-medium italic mt-1">
                             Logged: {f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                          </p>
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                       <div className="flex flex-col gap-1 items-end">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update Status</span>
                          <div className="flex gap-1">
                             {statuses.map(st => (
                               <button
                                 key={st}
                                 disabled={updatingId === f.id}
                                 onClick={() => updateStatus(f.id, f.userId, st)}
                                 className={cn(
                                   "w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2",
                                   f.status === st ? "bg-brand-accent border-brand-accent text-white" : "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:border-brand-accent/30"
                                 )}
                                 title={st.toUpperCase()}
                               >
                                 {st === 'placed' && <Clock className="w-4 h-4" />}
                                 {st === 'under review' && <Search className="w-4 h-4" />}
                                 {st === 'fix in progress' && <Loader2 className={cn("w-4 h-4", updatingId === f.id && "animate-spin")} />}
                                 {st === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="h-10 w-px bg-brand-border dark:bg-white/5 mx-2 hidden lg:block" />
                       <Button variant="outline" size="sm" className="h-12 px-6 uppercase text-[10px] tracking-widest gap-2">
                          <MessageSquare className="w-3 h-3" /> Notify User
                       </Button>
                    </div>
                 </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/5 flex gap-6 items-start">
         <AlertCircle className="w-6 h-6 text-brand-accent shrink-0 mt-1" />
         <div className="space-y-4">
            <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase italic tracking-tighter">Fix Workflow</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase">
              Fix requests are submitted by users when a project reaches the <span className="text-brand-success font-black">DELIVERED</span> status. Admins must review and update the status manually before marking as <span className="text-brand-success font-black">COMPLETED</span>.
            </p>
         </div>
      </div>
    </div>
  );
}

async function addDoc(col: any, data: any) {
  const { addDoc: firebaseAddDoc } = await import("../../firebase");
  return firebaseAddDoc(col, data);
}
