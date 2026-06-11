import { useState, useEffect } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Package, Globe, Shield, Database, MessageSquare, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { db, collection, query, where, onSnapshot, doc, runTransaction, serverTimestamp } from "../../firebase";
import { cn } from "../../utils/cn";

interface Project {
  id: string;
  name: string;
  subscriptions?: string[];
}

interface SubscriptionModel {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export default function Subscription() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [models, setModels] = useState<SubscriptionModel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const unsubProjects = onSnapshot(query(collection(db, "projects"), where("userId", "==", user.uid)), (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    });

    const unsubModels = onSnapshot(collection(db, "subscription_models"), (snap) => {
      setModels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubscriptionModel[]);
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubModels();
    };
  }, [user]);

  const handleActivate = async (model: SubscriptionModel) => {
    if (!user || !profile || !selectedProjectId) return;

    if (profile.balance < model.price) {
      alert("Insufficient funds. Visit the Fiscal Terminal to add capital.");
      window.location.href = "/wallet";
      return;
    }

    const project = projects.find(p => p.id === selectedProjectId);
    if (project?.subscriptions?.includes(model.id)) {
      alert("This project already has an active protocol for this service.");
      return;
    }

    setProcessingId(model.id);
    try {
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, "users", user.uid);
        const projectRef = doc(db, "projects", selectedProjectId);
        
        const userDoc = await tx.get(userRef);
        if (!userDoc.exists()) throw "User protocol not found";
        
        const currentBalance = userDoc.data().balance || 0;
        if (currentBalance < model.price) throw "Capital deficiency detected";

        // Update Balance
        tx.update(userRef, { balance: currentBalance - model.price });

        // Update Project
        const currentSubs = project?.subscriptions || [];
        tx.update(projectRef, { 
          subscriptions: [...currentSubs, model.id],
          [`sub_${model.id}_expiry`]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        // Log Transaction
        const txRef = doc(collection(db, "transactions"));
        tx.set(txRef, {
          userId: user.uid,
          type: "payment",
          amount: -model.price,
          status: "completed",
          description: `Subscription Activation: ${model.name} for ${project?.name}`,
          createdAt: serverTimestamp()
        });

        // Notify User
        const notifRef = doc(collection(db, "user_notifications"));
        tx.set(notifRef, {
          userId: user.uid,
          title: "Service Activated",
          message: `${model.name} is now operational for ${project?.name}.`,
          read: false,
          createdAt: serverTimestamp()
        });
      });
      alert(`Service ${model.name} activated successfully.`);
    } catch (err) {
      console.error(err);
      alert("Activation failed: " + err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
     return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
           <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Subscription Fleet...</p>
        </div>
     );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Subscription_Hub</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Active Infrastructure Services // Ecosystem Maintenance
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           <Card className="bg-white dark:bg-slate-900 border-none shadow-md">
              <CardTitle className="tracking-tighter uppercase italic text-sm mb-6">Target Node Selection</CardTitle>
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl p-5 text-xs font-black uppercase focus:outline-none focus:border-brand-accent transition-all text-brand-text-bold dark:text-white"
              >
                <option value="">-- INITIALIZE PROJECT SELECTION --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>PROJECT: {p.name}</option>
                ))}
              </select>
           </Card>

           <div className="grid md:grid-cols-2 gap-6">
              {models.length === 0 ? (
                <div className="md:col-span-2 py-20 text-center opacity-30 italic font-black text-sm uppercase tracking-widest">
                   No Service Modules Available
                </div>
              ) : (
                models.map((s) => {
                  const isActive = projects.find(p => p.id === selectedProjectId)?.subscriptions?.includes(s.id);
                  return (
                    <Card key={s.id} className={cn(
                      "group transition-all flex flex-col justify-between border-none shadow-lg bg-white dark:bg-slate-900",
                      isActive ? "ring-2 ring-brand-success ring-offset-4 ring-offset-slate-950" : "hover:border-brand-accent/30"
                    )}>
                       <div>
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-accent mb-6 transition-all border border-brand-border dark:border-white/5">
                            <Package className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">{s.name}</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 leading-relaxed italic line-clamp-3">
                            {s.description}
                          </p>
                       </div>
                       <div className="mt-8 pt-6 border-t border-brand-border dark:border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-black text-brand-text-bold dark:text-white italic tracking-tighter">${s.price}</p>
                            <p className="text-[9px] text-slate-500 font-black uppercase">PER_INTERVAL</p>
                          </div>
                          <Button 
                             disabled={!selectedProjectId || processingId === s.id}
                             onClick={() => handleActivate(s)}
                             className={cn(
                               "h-12 px-6 uppercase text-[10px] tracking-widest",
                               isActive ? "bg-brand-success/10 text-brand-success border border-brand-success/20 pointer-events-none" : "shadow-lg shadow-brand-primary/20"
                             )}
                          >
                             {processingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                              isActive ? <><CheckCircle2 className="w-4 h-4 mr-2" /> OPERATIONAL</> : "ACTIVATE"}
                          </Button>
                       </div>
                    </Card>
                  );
                })
              )}
           </div>
        </div>

        <div className="space-y-6">
           <Card className="bg-brand-primary text-white border-none shadow-2xl relative overflow-hidden group">
              <CardTitle className="text-white italic tracking-tighter uppercase text-sm relative z-10">Fleet Status</CardTitle>
              <div className="mt-8 space-y-6 relative z-10">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Project Status</span>
                    <span className={selectedProjectId ? "text-brand-success" : "text-amber-500"}>{selectedProjectId ? 'NODE_LOCKED' : 'AWAITING_SYNC'}</span>
                 </div>
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-300 font-bold uppercase leading-relaxed italic">
                       Subscriptions are project-specific. Activating a service module for one node does not replicate across the ecosystem.
                    </p>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[45deg] transition-transform duration-700 group-hover:translate-x-10" />
           </Card>

           <Card className="border shadow-md">
              <div className="flex gap-3 text-amber-500 mb-4">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Renewal Protocol</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase italic">
                All subscriptions use automated fiscal deduction. Ensure balance is maintained in the <span className="text-brand-text-bold dark:text-white">FISCAL TERMINAL</span> before expiry timestamps.
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}
