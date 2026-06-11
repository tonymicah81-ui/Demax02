import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { doc, getDoc, db } from "../../firebase";

export default function VaultLogin() {
  const { user, signin, signout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await signin(email, password);
      // Wait, AuthContext signin doesn't return user credential easily if it just returns promise
      // In AuthContext I didn't return it, but I can check current user
      
      const adminRef = doc(db, 'admins', (userCredential as any)?.user?.uid || "");
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        await signout();
        throw new Error("ACCESS_DENIED: IDENTITY_NOT_FOUND_IN_VAULT");
      }

      const data = adminSnap.data();
      if (data.status === 'inactive') {
        await signout();
        throw new Error("ACCESS_DENIED: IDENTITY_INACTIVE_BY_ADMIN");
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-primary dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-brand-text transition-colors duration-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-1/4 translate-x-1/2 w-64 h-64 bg-brand-accent blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <Link to="/company/vault" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
             <ArrowLeft className="w-5 h-5" />
           </Link>
           <div className="text-right">
              <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Vault Identity</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Authorized Access_</p>
           </div>
        </div>

        <div className="p-10 space-y-8">
            <div className="text-center">
               <Logo size="lg" className="mx-auto mb-6 bg-white/10 p-4 rounded-2xl inline-flex" showText={false} />
               <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identity Retrieval</h2>
               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">Personnel Frequency Match Required</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Registry Email</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="email" 
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-accent transition-all"
                     placeholder="AUTH@VAULT.CORE"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Frequency Key</label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type={showPassword ? "text" : "password"} 
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-accent transition-all"
                     placeholder="••••••••"
                   />
                   <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-accent transition-colors"
                   >
                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
               </div>

               <Button
                 type="submit"
                 disabled={loading}
                 className="w-full h-14 bg-brand-accent hover:bg-brand-accent/90 transition-all text-xs font-black shadow-xl text-white"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "EXECUTE ACCESS LINK_"}
               </Button>
            </form>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] font-black uppercase tracking-widest text-center italic"
                >
                  ACCESS_DENIED:: {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4 text-center">
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic opacity-50 underline">DT-Secure Communication Protocol // DTZ-11</p>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
