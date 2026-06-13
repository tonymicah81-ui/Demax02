import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export default function Login() {
  const { user, signin } = useAuth();
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
      await signin(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-brand-text transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.2)] border border-brand-border dark:border-white/5 overflow-hidden"
      >
        <div className="bg-brand-primary p-12 text-center border-b border-brand-border dark:border-white/5 relative">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Logo size="lg" className="bg-white/10 p-3 rounded-2xl" showText={false} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Welcome Back</h1>
          <p className="text-slate-400 mt-2 text-xs font-mono uppercase tracking-[0.3em]">Sign in to your account</p>
          
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="p-10 space-y-8">
            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="email" 
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-bold focus:outline-none focus:border-brand-accent transition-all animate-none"
                     placeholder="your@email.com"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type={showPassword ? "text" : "password"} 
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-12 py-4 text-xs font-bold focus:outline-none focus:border-brand-accent transition-all"
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
                 className="w-full h-14 bg-brand-primary dark:bg-brand-accent hover:opacity-90 transition-all text-xs font-black shadow-xl"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIGN IN"}
               </Button>
            </form>

            {error && (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest text-center italic"
              >
                {error}
              </motion.div>
            )}

            <div className="pt-8 border-t border-brand-border dark:border-white/5 text-center">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Don't have an account?</p>
               <Link 
                 to="/signup"
                 className="text-[11px] font-black text-brand-accent hover:underline uppercase tracking-[0.2em] italic"
               >
                 &gt; Create an Account
               </Link>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
