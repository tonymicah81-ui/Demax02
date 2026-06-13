import { useState, useEffect } from "react";
import { 
  Layers, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  ExternalLink,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { useAuth } from "../../AuthContext";
import { db, collection, query, where, onSnapshot, orderBy } from "../../firebase";
import { cn } from "../../utils/cn";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";

interface Project {
  id: string;
  serviceName: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: any;
  price: number;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "projects"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusInfo = (status: Project['status']) => {
    switch (status) {
      case 'completed': return { color: 'text-brand-success', bg: 'bg-brand-success/10', label: 'DEPLOYED', icon: CheckCircle };
      case 'in-progress': return { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'In Progress', icon: Clock };
      default: return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending', icon: AlertCircle };
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">My Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            All projects linked to your account
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input type="text" placeholder="ID_SEARCH..." className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-lg pl-9 pr-4 py-2 text-[10px] font-mono focus:outline-none focus:border-brand-accent transition-all uppercase" />
           </div>
        </div>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {projects.length === 0 && !loading ? (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="p-20 text-center space-y-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5"
             >
                <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                   <h3 className="text-lg font-bold text-brand-text-bold dark:text-white uppercase italic tracking-tighter">No Active Protocols</h3>
                   <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">Visit the marketplace to initialize your first business asset.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href='/marketplace'}>Browse Marketplace</Button>
             </motion.div>
          ) : (
            projects.map((project, i) => {
              const info = getStatusInfo(project.status);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-0 border-none overflow-hidden group hover:shadow-xl transition-all shadow-md">
                     <div className="flex flex-col md:flex-row items-stretch">
                        <div className="p-8 flex-1 bg-white dark:bg-slate-900">
                           <div className="flex items-center gap-3 mb-4">
                              <div className={cn("px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest", info.bg, info.color)}>
                                 {info.label}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest italic">ID: {project.id.slice(0, 8)}</span>
                           </div>
                           <h3 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic mb-2">{project.serviceName}</h3>
                           <div className="flex items-center gap-6 mt-6">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                 <Clock className="w-4 h-4" />
                                 <span>{project.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : "PENDING"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                 <span className="text-brand-accent font-black">$</span>
                                 <span>INITIAL_COMMIT: ${project.price}.00</span>
                              </div>
                           </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-8 flex flex-row md:flex-col items-center justify-center gap-4 border-l border-brand-border dark:border-white/5">
                           <Button variant="outline" size="sm" className="w-full md:w-40 gap-2 h-12 text-[10px]">
                              View Asset <ExternalLink className="w-3.5 h-3.5" />
                           </Button>
                           <Button variant="ghost" size="sm" className="w-12 h-12 p-0 rounded-xl">
                              <MoreVertical className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
