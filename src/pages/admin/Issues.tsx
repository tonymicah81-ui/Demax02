import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { AlertCircle, Clock, CheckCircle, Search } from "lucide-react";
import { motion } from "motion/react";

export default function AdminIssues() {
  const issues = [
    { id: "ISS-98", title: "API Request Timeout", status: "open", priority: "critical", time: "2h ago" },
    { id: "ISS-82", title: "Asset Load Failure", status: "resolved", priority: "low", time: "5h ago" },
    { id: "ISS-44", title: "User Data Sync Issue", status: "open", priority: "medium", time: "1d ago" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Support Issues</h1>
          <p className="text-red-500 font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Track and resolve platform-level issues
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Search issues..." className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-medium focus:outline-none focus:border-brand-accent transition-all w-64" />
           </div>
        </div>
      </div>

      <div className="grid gap-6">
        {issues.map((issue, i) => (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:border-brand-accent/30 transition-all border shadow-md group">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className={cn(
                       "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
                       issue.status === 'open' ? "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-100 dark:border-red-900/30" : "bg-green-50 dark:bg-green-950/20 text-brand-success border-green-100 dark:border-green-900/30"
                     )}>
                        <AlertCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                             issue.priority === 'critical' ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                           )}>
                              {issue.priority}
                           </span>
                           <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">ID: {issue.id}</span>
                        </div>
                        <h3 className="text-lg font-bold text-brand-text-bold dark:text-white uppercase tracking-tight italic">{issue.title}</h3>
                     </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="text-right">
                        <p className="text-[10px] font-mono text-slate-400 uppercase">{issue.time}</p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", issue.status === 'open' ? "text-amber-500" : "text-brand-success")}>
                           {issue.status === 'open' ? "Open" : "Resolved"}
                        </p>
                     </div>
                     {issue.status === 'open' ? (
                       <Button size="sm" variant="outline" className="h-10 text-xs">Mark as Resolved</Button>
                     ) : (
                       <div className="w-10 h-10 rounded-full border-2 border-brand-success/20 flex items-center justify-center">
                          <CheckCircle className="text-brand-success w-5 h-5" />
                       </div>
                     )}
                  </div>
               </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
