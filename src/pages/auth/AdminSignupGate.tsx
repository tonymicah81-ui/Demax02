import { motion } from "motion/react";
import { Lock, ShieldCheck, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminSignupGate() {
  return (
    <div className="min-h-screen bg-brand-primary dark:bg-slate-950 flex flex-col items-center justify-center px-4 font-sans transition-colors duration-500 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-success/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full grid md:grid-cols-2 gap-8 z-10"
      >
        <div className="flex flex-col justify-center space-y-8 p-8">
           <div className="inline-flex items-center gap-2 mb-2">
             <div className="flex -space-x-1">
               <div className="w-6 h-6 rounded bg-brand-accent" />
               <div className="w-6 h-6 rounded bg-brand-success" />
             </div>
             <span className="font-extrabold text-xl tracking-tighter text-white uppercase">
               DUREX <span className="text-brand-success">VAULT</span>
             </span>
           </div>
           
           <div>
             <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">Standard<br/>Authority_</h1>
             <p className="mt-6 text-slate-400 font-medium text-lg leading-relaxed max-w-sm">
               Secure portal for institutional partners, administration staff, and system architects.
             </p>
           </div>
           
           <div className="flex items-center gap-4 py-6 border-y border-white/10">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-brand-success">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Protocol DT-8829</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Encrypted Multi-Tenant Tunnel</p>
              </div>
           </div>
        </div>

        <div className="grid gap-6">
           <Link to="/company/vault/login">
              <motion.div 
                whileHover={{ x: 10 }}
                className="group h-full bg-white/5 hover:bg-white/10 border border-white/10 p-10 rounded-3xl transition-all flex flex-col justify-between"
              >
                 <LogIn className="w-10 h-10 text-brand-accent mb-8" />
                 <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Existing Admin</h2>
                    <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-widest">Access management console_</p>
                 </div>
                 <div className="mt-8 flex items-center gap-2 text-brand-accent font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                   Execute Login <ArrowRight className="w-3 h-3" />
                 </div>
              </motion.div>
           </Link>

           <Link to="/company/vault/signup">
              <motion.div 
                whileHover={{ x: 10 }}
                className="group h-full bg-white/5 hover:bg-brand-success/10 border border-white/10 hover:border-brand-success/30 p-10 rounded-3xl transition-all flex flex-col justify-between"
              >
                 <UserPlus className="w-10 h-10 text-brand-success mb-8" />
                 <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Vault Registration</h2>
                    <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-widest">Initialize authorized registry_</p>
                 </div>
                 <div className="mt-8 flex items-center gap-2 text-brand-success font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                   Start Onboarding <ArrowRight className="w-3 h-3" />
                 </div>
              </motion.div>
           </Link>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-center">
         <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Authorized Personnel Only // Restricted Network Area</p>
      </div>
    </div>
  );
}
