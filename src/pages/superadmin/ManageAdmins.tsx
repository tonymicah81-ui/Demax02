import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  ShieldX, 
  Loader2,
  Trash2,
  Zap
} from "lucide-react";
import { db, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "../../firebase";
import { cn } from "../../utils/cn";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";

interface AdminProfile {
  adminId: string;
  email: string;
  role: string;
  status: string;
}

export default function ManageAdmins() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    // We check the 'admins' collection
    const q = query(collection(db, "admins"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        adminId: doc.id,
        ...doc.data()
      })) as AdminProfile[];
      setAdmins(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const changeRole = async (adminId: string, newRole: string) => {
    setActingId(adminId);
    try {
      await updateDoc(doc(db, "admins", adminId), { role: newRole });
      await updateDoc(doc(db, "users", adminId), { role: newRole });
    } catch (err) {
      console.error(err);
      alert("Role mutation failed. Authority rejected.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Authority Control</h1>
          <p className="text-brand-success font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Admin Hierarchy Management // Access Level Mutation
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Button size="sm" className="gap-2">
             <UserPlus className="w-4 h-4" /> Initialize Authority
           </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {admins.map((admin, i) => (
            <motion.div
              key={admin.adminId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="relative overflow-hidden group">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-brand-border dark:border-white/5 text-slate-400">
                     <ShieldCheck className={cn("w-7 h-7", admin.role === 'super_admin' ? "text-brand-success" : "text-brand-accent")} />
                   </div>
                   <div className="min-w-0">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Authorized Subject</p>
                     <p className="text-sm font-bold text-brand-text-bold dark:text-white truncate uppercase tracking-tight italic">{admin.email}</p>
                   </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Clearance Level:</span>
                       <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] italic">{admin.role}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Status:</span>
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-[0.2em] italic",
                         admin.status === 'active' ? "text-brand-success" : "text-amber-500"
                       )}>{admin.status}</span>
                    </div>
                 </div>

                 <div className="mt-8 pt-8 border-t border-brand-border dark:border-white/5 grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[9px] h-10"
                      disabled={actingId === admin.adminId}
                      onClick={() => changeRole(admin.adminId, admin.role === 'admin' ? 'super_admin' : 'admin')}
                    >
                      {actingId === admin.adminId ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                        admin.role === 'admin' ? "MIGRATE TO SUPER" : "DEMOTE TO ADMIN"
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[9px] h-10 border-red-500/20 text-red-500 hover:bg-red-50"
                      disabled={actingId === admin.adminId}
                      onClick={() => changeRole(admin.adminId, 'client')}
                    >
                       REVOKE ACCESS
                    </Button>
                 </div>

                 {/* Identity Pulse */}
                 <div className="absolute top-0 right-0 p-4">
                    <Zap className={cn("w-4 h-4 opacity-10", admin.status === 'active' ? "text-brand-success" : "text-amber-500")} />
                 </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="py-32 flex flex-col items-center gap-4 opacity-50">
           <Loader2 className="w-10 h-10 animate-spin text-brand-success" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Accessing Authority Registry...</p>
        </div>
      )}
    </div>
  );
}
