import { useState, useEffect } from "react";
import { 
  Settings, 
  ShieldAlert, 
  Cpu, 
  Database, 
  Globe, 
  Zap,
  Activity,
  ArrowUpRight,
  CreditCard,
  Building,
  User as UserIcon,
  Save,
  Loader2,
  Lock
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { motion } from "motion/react";
import { db, doc, getDoc, setDoc, serverTimestamp } from "../../firebase";

export default function SuperDashboard() {
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    reference: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system_config", "payment_details")).then(snap => {
      if (snap.exists()) setBankDetails(snap.data() as any);
      setLoading(false);
    });
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "system_config", "payment_details"), {
        ...bankDetails,
        updatedAt: serverTimestamp()
      });
      alert("Platform fiscal parameters updated.");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Source Authority</h1>
          <p className="text-brand-success font-black mt-2 uppercase tracking-[0.3em] text-[10px] italic">
            Durex Core Engine // Quantum Protocol Management
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-5 py-2.5 bg-slate-950 border border-brand-success/30 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-success animate-ping" />
              <span className="text-[10px] font-mono text-brand-success uppercase tracking-[0.3em] font-black">Core_Stabilized::Full_Access</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
               <Card className="bg-slate-900 border-white/5 text-white">
                  <div className="flex items-center justify-between mb-8">
                     <div className="p-3 bg-brand-accent/20 rounded-xl text-brand-accent">
                        <Cpu className="w-6 h-6" />
                     </div>
                     <span className="text-[10px] font-mono text-slate-500 uppercase">Load: OPTIMAL</span>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Engine Processing</h3>
                  <p className="text-4xl font-black italic tracking-tighter">1.2 PHz</p>
                  <div className="mt-8 flex items-center gap-2 text-brand-success text-[10px] font-black uppercase tracking-widest">
                     <Activity className="w-3.5 h-3.5 animate-pulse" />
                     <span>Neural_Sync_Active</span>
                  </div>
               </Card>

               <Card className="bg-slate-900 border-white/5 text-white">
                  <div className="flex items-center justify-between mb-8">
                     <div className="p-3 bg-brand-success/20 rounded-xl text-brand-success">
                        <Database className="w-6 h-6" />
                     </div>
                     <span className="text-[10px] font-mono text-slate-500 uppercase">I/O: SECURE</span>
                  </div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Data Throughput</h3>
                  <p className="text-4xl font-black italic tracking-tighter">8.4 TB/s</p>
                  <div className="mt-8 flex items-center gap-2 text-brand-accent text-[10px] font-black uppercase tracking-widest">
                     <Zap className="w-3.5 h-3.5" />
                     <span>GCP_Interface_Green</span>
                  </div>
               </Card>
            </div>

            <Card className="space-y-8">
               <div className="flex items-center justify-between">
                  <CardTitle className="uppercase italic tracking-tighter">Platform Fiscal Configuration</CardTitle>
                  <Lock className="w-4 h-4 text-brand-accent" />
               </div>
               
               {loading ? (
                 <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
                 </div>
               ) : (
                 <form onSubmit={handleSaveConfig} className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Bank Name</label>
                          <div className="relative">
                             <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="text" 
                               required
                               value={bankDetails.bankName}
                               onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                               className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold uppercase transition-all focus:border-brand-accent outline-none"
                               placeholder="GLOBAL_BANK..."
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Account Name</label>
                          <div className="relative">
                             <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="text" 
                               required
                               value={bankDetails.accountName}
                               onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                               className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold uppercase transition-all focus:border-brand-accent outline-none"
                               placeholder="SOURCE_ARCHITECT..."
                             />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Account Number</label>
                          <div className="relative">
                             <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                               type="text" 
                               required
                               value={bankDetails.accountNumber}
                               onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                               className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold uppercase transition-all focus:border-brand-accent outline-none"
                               placeholder="0000-0000-0000..."
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Payment Reference (Ref: UID)</label>
                          <input 
                            type="text" 
                            value={bankDetails.reference}
                            onChange={(e) => setBankDetails({...bankDetails, reference: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-2xl p-4 text-xs font-bold uppercase transition-all focus:border-brand-accent outline-none"
                            placeholder="USE_SOURCE_UID..."
                          />
                       </div>
                       <div className="pt-2">
                          <Button disabled={saving} className="w-full h-14 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-xl shadow-brand-accent/20 rounded-2xl gap-3">
                             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> COMMIT_SYNC_PARAMS</>}
                          </Button>
                       </div>
                    </div>
                 </form>
               )}
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-brand-accent text-white border-none shadow-2xl relative overflow-hidden">
               <CardTitle className="text-white uppercase italic tracking-tighter">Authorized Personal</CardTitle>
               <div className="mt-8 space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-black/20 overflow-hidden border-2 border-white/20">
                        <img src="https://picsum.photos/seed/tony/100/100" referrerPolicy="no-referrer" alt="Tony" />
                     </div>
                     <div>
                        <p className="text-xs font-black uppercase tracking-tight">Tony Micah</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Source Architect</p>
                     </div>
                  </div>
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 uppercase italic text-[10px] font-black" onClick={() => window.location.href = '/admin/users'}>Manage Authorities</Button>
               </div>
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            </Card>

            <Card className="p-8 space-y-6">
               <CardTitle className="uppercase italic tracking-tighter">System Pulse</CardTitle>
               <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-brand-success" />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">RELAY_DT_0{i}</span>
                       </div>
                       <span className="text-[10px] font-mono text-brand-accent">0.02ms</span>
                    </div>
                  ))}
               </div>
               <div className="pt-4">
                  <p className="text-[9px] font-medium text-slate-400 text-center leading-relaxed">
                     All sub-processor units are currently architected to maximum efficiency parameters.
                  </p>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

import { cn } from "../../utils/cn";
