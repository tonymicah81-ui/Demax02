import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  Globe,
  Mail,
  Zap,
  Package,
  Activity,
  Trash2,
  Edit3,
  Flag,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { db, collection, addDoc, onSnapshot, query, doc, updateDoc, serverTimestamp, orderBy, getDocs, where, deleteDoc } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";
import { logAudit } from "../../lib/audit";
import {
  Milestone, MilestoneStatus,
  createMilestone, getMilestones, updateMilestoneStatus, deleteMilestone,
  MILESTONE_STATUS_LABELS, MILESTONE_STATUS_COLORS
} from "../../lib/milestoneService";

function MilestonePanel({ projectId, userId }: { projectId: string; userId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMilestones(projectId).then(ms => { setMilestones(ms); setLoading(false); });
  }, [projectId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const id = await createMilestone({
        projectId, userId,
        title: newTitle,
        description: newDesc,
        order: milestones.length + 1,
      });
      const updated = await getMilestones(projectId);
      setMilestones(updated);
      setNewTitle(''); setNewDesc(''); setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: MilestoneStatus) {
    await updateMilestoneStatus(id, status);
    const updated = await getMilestones(projectId);
    setMilestones(updated);
  }

  async function handleDelete(id: string) {
    await deleteMilestone(id);
    setMilestones(ms => ms.filter(m => m.id !== id));
  }

  if (loading) return <div className="py-4 flex items-center gap-2 text-[10px] text-slate-400 uppercase font-black"><Loader2 className="w-4 h-4 animate-spin" />Loading milestones...</div>;

  return (
    <div className="space-y-3">
      {milestones.length === 0 && !adding && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">No milestones yet</p>
      )}
      {milestones.map(m => (
        <div key={m.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5">
          <Flag className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-text-bold dark:text-white truncate">{m.title}</p>
            {m.description && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{m.description}</p>}
            <select
              value={m.status}
              onChange={e => handleStatusChange(m.id, e.target.value as MilestoneStatus)}
              className={cn(
                "mt-2 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none outline-none cursor-pointer",
                MILESTONE_STATUS_COLORS[m.status]
              )}
            >
              {(Object.keys(MILESTONE_STATUS_LABELS) as MilestoneStatus[]).map(s => (
                <option key={s} value={s}>{MILESTONE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <button onClick={() => handleDelete(m.id)} className="text-slate-300 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <AnimatePresence>
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="space-y-2 pt-2"
          >
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              placeholder="Milestone title..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-brand-accent transition-all"
            />
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-accent transition-all"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="text-[9px] px-4 py-2 gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add
              </Button>
              <button type="button" onClick={() => setAdding(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-accent hover:text-brand-accent/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Milestone
        </button>
      )}
    </div>
  );
}

export default function AdminProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());

  const toggleMilestones = (id: string) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  
  const [formData, setFormData] = useState({
    userId: "",
    userEmail: "",
    name: "",
    domain: "",
    expiryDate: "",
    status: "pending"
  });

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUserSearch = async () => {
    if (!userSearch.trim()) return;
    const q = query(collection(db, "users"), where("email", "==", userSearch.trim()));
    const snap = await getDocs(q);
    setUserResults(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) return alert("Please select a target user node.");
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        ...formData,
        createdAt: serverTimestamp(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null
      });
      logAudit(user as any, "PROJECT_CREATED", `Created project '${formData.name}' for user ${formData.userEmail}`, docRef.id, "project");
      setShowModal(false);
      setFormData({ userId: "", userEmail: "", name: "", domain: "", expiryDate: "", status: "pending" });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (projectId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), { status: newStatus });
      logAudit(user as any, "PROJECT_STATUS_UPDATED", `Updated project ${projectId} to ${newStatus}`, projectId, "project");
    } catch (err) {
      console.error(err);
    }
  };

  const statuses = [
    "pending", 
    "domain bought", 
    "email spam setup complete", 
    "smartsupp working", 
    "hosted and delivered"
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Project Management</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            View and manage all client projects
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="PROJ_NAME_TRACER..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-mono w-64 uppercase" 
              />
           </div>
           <Button onClick={() => setShowModal(true)} className="h-12 px-6 rounded-xl gap-2">
              <Plus className="w-5 h-5" /> 
              <span className="text-[10px] uppercase font-black tracking-widest italic">New_Project</span>
           </Button>
        </div>
      </div>

      <div className="grid gap-6">
         {loading ? (
           <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Deployment Stream...</p>
           </div>
         ) : projects.length === 0 ? (
           <div className="py-20 text-center border-2 border-dashed border-brand-border dark:border-white/5 rounded-[40px] opacity-20">
              <Package className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-black uppercase italic tracking-tighter">No Active Deployments</p>
           </div>
         ) : (
           projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((proj, i) => (
             <motion.div 
               key={proj.id} 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }}
               className="group relative"
             >
                <Card className="hover:border-brand-accent/30 transition-all border-none bg-white dark:bg-slate-900 shadow-xl p-0 overflow-hidden">
                   <div className="flex flex-col xl:flex-row items-stretch">
                      <div className="xl:w-1/3 p-8 border-b xl:border-b-0 xl:border-r border-brand-border dark:border-white/5 space-y-6">
                         <div>
                            <div className="flex items-center gap-2 mb-2">
                               <Globe className="w-4 h-4 text-brand-accent" />
                               <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Global_Designation: {proj.id.slice(0, 8)}</span>
                            </div>
                            <h3 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">{proj.name}</h3>
                            <p className="text-sm font-mono text-brand-accent mt-1 lowercase underline">{proj.domain || "no-domain-assigned.com"}</p>
                         </div>
                         <div className="space-y-3 pt-6 border-t border-brand-border dark:border-white/5">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                               <span>Assigned_Node</span>
                               <span className="text-brand-text-bold dark:text-white">{proj.userEmail}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                               <span>Expiry_Chron</span>
                               <span className="text-red-500">{proj.expiryDate ? new Date(proj.expiryDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                            </div>
                         </div>
                      </div>

                      <div className="flex-1 p-8 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-center">
                         <div className="mb-6 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Deployment_Progress</p>
                            <span className="text-[10px] font-mono text-brand-success uppercase font-black tracking-widest">
                               {Math.round(((statuses.indexOf(proj.status) + 1) / statuses.length) * 100)}% Complete
                            </span>
                         </div>
                         <div className="grid grid-cols-5 gap-2 h-2 mb-8">
                            {statuses.map((s, idx) => (
                              <div key={s} className={cn(
                                "rounded-full transition-all duration-500",
                                statuses.indexOf(proj.status) >= idx ? "bg-brand-success shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-slate-200 dark:bg-slate-800"
                              )} />
                            ))}
                         </div>
                         <div className="flex flex-wrap gap-3">
                            {statuses.map(s => (
                              <button 
                                key={s}
                                onClick={() => updateStatus(proj.id, s)}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                  proj.status === s 
                                   ? "bg-brand-success text-white border-brand-success shadow-lg" 
                                   : "border-brand-border dark:border-white/5 text-slate-400 hover:border-brand-accent/30"
                                )}
                              >
                                 {s}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Milestones expandable section */}
                   <div className="border-t border-brand-border dark:border-white/5">
                     <button
                       onClick={() => toggleMilestones(proj.id)}
                       className="w-full flex items-center justify-between px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-accent transition-colors"
                     >
                       <span className="flex items-center gap-2">
                         <Flag className="w-4 h-4" /> Milestones
                       </span>
                       {expandedMilestones.has(proj.id)
                         ? <ChevronUp className="w-4 h-4" />
                         : <ChevronDown className="w-4 h-4" />}
                     </button>
                     <AnimatePresence>
                       {expandedMilestones.has(proj.id) && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                         >
                           <div className="px-8 pb-8">
                             <MilestonePanel projectId={proj.id} userId={proj.userId} />
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                </Card>
             </motion.div>
           ))
         )}
      </div>

      <AnimatePresence>
         {showModal && (
           <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[40px] border border-brand-border dark:border-white/10 shadow-2xl max-w-2xl w-full overflow-hidden">
                 <div className="p-10 border-b border-brand-border dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                    <div>
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-1">New Project</h2>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add a new project for a client</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">✕</button>
                 </div>

                 <form onSubmit={handleCreate} className="p-10 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">User Email</label>
                             <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={userSearch}
                                  onChange={(e) => setUserSearch(e.target.value)}
                                  placeholder="node@durex.com" 
                                  className="flex-1 bg-slate-100 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl p-4 text-xs font-bold uppercase" 
                                />
                                <button type="button" onClick={handleUserSearch} className="w-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center"><Search className="w-5 h-5" /></button>
                             </div>
                             <div className="space-y-2 max-h-[100px] overflow-y-auto">
                                {userResults.map(u => (
                                  <button key={u.uid} type="button" onClick={() => setFormData({...formData, userId: u.uid, userEmail: u.email})} className={cn("w-full p-3 rounded-xl border text-[10px] font-bold uppercase transition-all", formData.userId === u.uid ? "bg-brand-success/10 border-brand-success text-brand-success" : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-brand-border")}>{u.email}</button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Project Identifier</label>
                             <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="ECOMMERCE_HUB_V1" className="w-full bg-slate-100 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl p-4 text-xs font-bold uppercase italic" />
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Network Domain</label>
                             <div className="relative">
                               <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                               <input type="text" placeholder="example.com" value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold lowercase" />
                             </div>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Lifecycle Expiry</label>
                             <div className="relative">
                               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                               <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold uppercase transition-all" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full h-16 rounded-[20px] shadow-2xl shadow-brand-accent/20">
                       {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <div className="flex items-center gap-3"><Zap className="w-6 h-6" /> <span className="text-sm font-black italic tracking-widest">DEPLOY_TO_INFRASTRUCTURE</span></div>}
                    </Button>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
