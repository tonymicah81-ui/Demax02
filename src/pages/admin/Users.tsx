import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Filter
} from "lucide-react";
import { db, collection, query, onSnapshot, doc, updateDoc, orderBy, addDoc, serverTimestamp } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { logAudit } from "../../lib/audit";
import { cn } from "../../utils/cn";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";

interface Profile {
  uid: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: any;
}

export default function ManageUsers() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as Profile[];
      setProfiles(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredProfiles = profiles.filter(p => 
    p.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p as any).phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStatus = async (profile: Profile, currentStatus: string) => {
    const uid = profile.uid;
    setUpdatingId(uid);
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, "users", uid), { status: newStatus });
      await updateDoc(doc(db, "admins", uid), { status: newStatus }).catch(() => {});
      logAudit(user as any, "USER_STATUS_MUTATED", `Changed status of ${profile.email} to ${newStatus}`, uid, "user");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Entity Registry</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Durex Identity Database // Population Monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="IDENTITY_SEARCH..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all uppercase w-64" 
             />
           </div>
           <Button variant="outline" size="sm" className="h-11 w-11 p-0 rounded-xl">
             <Filter className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-brand-border dark:border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Designation</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Security Clearance</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Internal Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initialized At</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border dark:divide-white/5">
              {filteredProfiles.map((profile, i) => (
                <motion.tr 
                  key={profile.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-brand-border dark:border-white/5 flex-shrink-0">
                         <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-sm font-bold text-brand-text-bold dark:text-white uppercase tracking-tight italic">{profile.username || "Unknown"}</p>
                         <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500 font-mono lowercase">{profile.email}</p>
                            {(profile as any).phone && <span className="text-[8px] font-mono text-slate-400 uppercase italic">| {(profile as any).phone}</span>}
                         </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5">
                       <ShieldCheck className={cn("w-3.5 h-3.5", profile.role === 'super_admin' ? "text-brand-success" : "text-brand-accent")} />
                       <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{profile.role}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest",
                      profile.status === 'active' ? "bg-brand-success/10 text-brand-success" : "bg-red-500/10 text-red-500"
                    )}>
                       <div className={cn("w-1.5 h-1.5 rounded-full", profile.status === 'active' ? "bg-brand-success animate-pulse" : "bg-red-500")} />
                       {profile.status}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-mono text-slate-400 italic">
                      {profile.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString() : "---"}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-10 px-4 rounded-xl text-[10px] font-black flex items-center gap-2",
                          profile.status === 'active' ? "text-red-500 hover:bg-red-50" : "text-brand-success hover:bg-brand-success/10"
                        )}
                        onClick={() => toggleStatus(profile, profile.status)}
                        disabled={updatingId === profile.uid}
                      >
                        {updatingId === profile.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                             {profile.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                             {profile.status === 'active' ? "DEACTIVATE" : "INITIALIZE"}
                          </>
                        )}
                      </Button>
                      <button className="p-2.5 text-slate-400 hover:text-brand-text-bold dark:hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-50">
             <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Downloading Entity Stream...</p>
          </div>
        )}
      </div>
    </div>
  );
}
