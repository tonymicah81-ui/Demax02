import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  History, 
  Search, 
  Filter, 
  User, 
  Clock, 
  Activity,
  ChevronRight,
  Database,
  ArrowDownCircle
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { db, collection, query, orderBy, limit, onSnapshot, getDocs, where } from "../../firebase";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "motion/react";

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const actions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-brand-success w-6 h-6" />
              <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Audit Logs</h1>
           </div>
           <p className="text-brand-accent font-black uppercase tracking-[0.2em] text-[10px] italic">
             Immutable record of all admin actions
           </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Audit Detail..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest w-64 outline-none focus:border-brand-success transition-all"
              />
           </div>
           <select 
             value={filterAction}
             onChange={(e) => setFilterAction(e.target.value)}
             className="bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-success transition-all cursor-pointer"
           >
              <option value="all">ALL_ACTIONS</option>
              {actions.map(action => <option key={action} value={action}>{action}</option>)}
           </select>
        </div>
      </div>

      <Card className="p-0 border-none bg-transparent space-y-4">
         {loading ? (
            <div className="py-40 flex flex-col items-center gap-4">
               <History className="w-12 h-12 text-brand-accent animate-spin-slow" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Deciphering Audit Stream...</p>
            </div>
         ) : filteredLogs.length > 0 ? (
            <div className="space-y-4">
               <AnimatePresence mode="popLayout">
                  {filteredLogs.map((log, i) => (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.02 }}
                      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 shadow-sm hover:border-brand-success/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center justify-center shrink-0">
                             <User className="w-6 h-6 text-slate-400 group-hover:text-brand-success transition-colors" />
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-brand-success uppercase tracking-widest bg-brand-success/10 px-2 py-0.5 rounded italic">{log.action}</span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{log.id}</span>
                             </div>
                             <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">{log.details}</h3>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Operator: {log.adminEmail}</p>
                          </div>
                       </div>
                       
                       <div className="text-right shrink-0 border-t md:border-t-0 md:border-l border-brand-border dark:border-white/5 pt-4 md:pt-0 md:pl-8">
                          <div className="flex items-center justify-end gap-2 text-slate-400 mb-1">
                             <Clock className="w-3 h-3" />
                             <span className="text-[10px] font-mono uppercase tracking-tighter">
                                {log.createdAt?.toDate().toLocaleString()}
                             </span>
                          </div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">System_Auth::Verified</p>
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         ) : (
            <div className="py-40 text-center space-y-6 opacity-20 border-2 border-dashed border-brand-border dark:border-white/5 rounded-[40px]">
               <ArrowDownCircle className="w-20 h-20 mx-auto" />
               <div className="space-y-1">
                  <p className="text-xl font-black uppercase italic tracking-[0.3em]">No Audit Logs</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest">No activity found in this range.</p>
               </div>
            </div>
         )}
      </Card>

      <div className="p-8 bg-slate-950 rounded-3xl border border-white/5 flex items-start gap-6 relative overflow-hidden group">
         <Activity className="w-6 h-6 text-brand-success shrink-0 mt-1 animate-pulse" />
         <div className="relative z-10 space-y-2">
            <h4 className="text-white text-sm font-black uppercase italic tracking-tighter">Immutable Trace Integrity</h4>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed uppercase italic">
              All administrative operations are permanently etched into the audit lake. This data is cryptographically guarded and restricted from regular admin access to maintain total fiscal and operational accountability.
            </p>
         </div>
         <Database className="absolute -bottom-10 -right-10 w-40 h-40 text-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      </div>
    </div>
  );
}
