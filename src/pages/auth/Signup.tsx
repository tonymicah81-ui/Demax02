import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Loader2, Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export default function Signup() {
  const { user, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    tfaEnabled: false
  });

  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Security Lock: Passwords do not match.");
    }
    
    setLoading(true);
    setError("");
    try {
      await register(formData, 'user');
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. protocol rejected identity.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-brand-text transition-colors duration-500 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.2)] border border-brand-border dark:border-white/5 overflow-hidden"
      >
        <div className="bg-brand-primary p-12 text-center border-b border-brand-border dark:border-white/5 relative">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Logo size="lg" className="bg-white/10 p-3 rounded-2xl" showText={false} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-tight">Initialize Identity</h1>
          <p className="text-slate-400 mt-2 text-xs font-mono uppercase tracking-[0.3em]">Protocol Registry v1.2</p>
          
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="p-10 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Target Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-bold focus:outline-none focus:border-brand-accent transition-all uppercase"
                        placeholder="ENTITY_NAME"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Signal Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel" 
                        name="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-bold focus:outline-none focus:border-brand-accent transition-all"
                        placeholder="+0 000 000 0000"
                      />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Encrypted Email</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="email" 
                     name="email"
                     required
                     value={formData.email}
                     onChange={handleChange}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-bold focus:outline-none focus:border-brand-accent transition-all"
                     placeholder="SIGNAL@DUREX.CORE"
                   />
                 </div>
               </div>

               <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Confirm Protocol</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-bold focus:outline-none focus:border-brand-accent transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-brand-border dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest">2-Factor Authentication</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Enhanced Security Relay</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="tfaEnabled"
                      checked={formData.tfaEnabled}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:peer-focus:ring-brand-accent rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-accent"></div>
                  </label>
               </div>

               <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-brand-primary dark:bg-brand-accent hover:opacity-90 transition-all text-xs font-black shadow-xl"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "INITIALIZE ACCOUNT_"}
                  </Button>
               </div>

               <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                 By initializing this session, you agree to our <Link to="/terms" className="text-brand-accent underline">Terms of Data Governance</Link>.
               </p>
            </form>

            {error && (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest text-center italic"
              >
                CRITICAL_ERROR:: {error}
              </motion.div>
            )}

            <div className="pt-8 border-t border-brand-border dark:border-white/5 text-center">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Already authenticated?</p>
               <Link 
                 to="/login"
                 className="text-[11px] font-black text-brand-accent hover:underline uppercase tracking-[0.2em] italic"
               >
                 &gt; Access Existing Identity Log
               </Link>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
