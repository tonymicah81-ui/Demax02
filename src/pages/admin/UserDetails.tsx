import { useState, useEffect } from "react";
import { 
  User, 
  Wallet, 
  Activity, 
  Shield, 
  ExternalLink, 
  CheckCircle2, 
  Clock,
  ArrowLeft
} from "lucide-react";
import { db, doc, onSnapshot, getDoc } from "../../firebase";
import { cn } from "../../utils/cn";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  if (loading) return (
     <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
     </div>
  );

  if (!profile) return (
    <div className="p-10 text-center">
      <p>Entity not found.</p>
      <Button onClick={() => navigate(-1)} className="mt-4">Return</Button>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-6">
         <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-brand-accent transition-all shadow-sm"
         >
           <ArrowLeft className="w-6 h-6" />
         </button>
         <div>
            <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Entity_Intel</h1>
            <p className="text-brand-accent font-black mt-1 uppercase tracking-[0.2em] text-[10px] italic">
              Deep Dossier // {profile.email}
            </p>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-1 border-none bg-white dark:bg-slate-900 shadow-2xl p-0 overflow-hidden">
            <div className="h-32 bg-brand-primary p-8 relative">
               <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-[32px] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden">
                  <User className="w-12 h-12 text-slate-300" />
               </div>
            </div>
            <div className="p-8 pt-16 space-y-6">
               <div>
                  <h2 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">{profile.username}</h2>
                  <p className="text-xs font-mono text-slate-400 lowercase">{profile.uid}</p>
               </div>

               <div className="flex flex-wrap gap-2">
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                    profile.status === 'active' ? "bg-brand-success/10 text-brand-success" : "bg-red-500/10 text-red-500"
                  )}>
                    {profile.status}
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-brand-accent/10 text-brand-accent text-[9px] font-black uppercase tracking-widest">
                    {profile.role}
                  </div>
               </div>

               <div className="space-y-4 pt-6 border-t border-brand-border dark:border-white/5">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone_Signal</span>
                     <span className="text-xs font-bold text-brand-text-bold dark:text-white">{profile.phone || "---"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total_Credits</span>
                     <span className="text-xs font-black text-brand-success">${profile.balance?.toFixed(2) || "0.00"}</span>
                  </div>
               </div>
            </div>
         </Card>

         <div className="lg:col-span-2 grid md:grid-cols-2 gap-6 content-start">
            <Card className="p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <CardTitle className="italic uppercase tracking-tighter">Operational Wallet</CardTitle>
                  <Wallet className="w-5 h-5 text-brand-accent" />
               </div>
               <div className="py-4 text-center">
                  <p className="text-4xl font-black text-brand-text-bold dark:text-white">${profile.balance?.toFixed(2) || "0.00"}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Available Infrastructure Capital</p>
               </div>
               <Button className="w-full h-12 uppercase text-[10px] tracking-widest italic font-black">History Relay</Button>
            </Card>

            <Card className="p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <CardTitle className="italic uppercase tracking-tighter">Active Deployments</CardTitle>
                  <Activity className="w-5 h-5 text-brand-success" />
               </div>
               <div className="space-y-4">
                  <p className="text-xs text-slate-500 italic">No operational assets detected for this identity.</p>
               </div>
               <Button variant="outline" className="w-full h-12 uppercase text-[10px] tracking-widest italic font-black">Control Terminal</Button>
            </Card>
         </div>
      </div>
    </div>
  );
}
