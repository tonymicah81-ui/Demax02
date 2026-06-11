import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Loader2, Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export default function VaultSignup() {
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
    vaultPin: ""
  });

  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Security Lock: Passwords do not match.");
    }

    if (formData.vaultPin !== "8829") {
      return setError("VAULT_FAILURE: ACCESS_PIN_INVALID");
    }
    
    setLoading(true);
    setError("");
    try {
      // Registering as 'admin' type ensures it goes to 'admins' collection
      await register(formData, 'admin');
      // After signup, take them to a "Success/Pending" state or just home since they are inactive
      alert("Registration Successful. Your account is currently INACTIVE. A Super Admin must authorize your credentials before you can access the dashboard.");
      navigate("/company/vault");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registry initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-brand-primary dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-brand-text transition-colors duration-500 py-12 relative overflow-hidden">
      {/* Visual background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-10 left-10 w-64 h-64 bg-brand-accent blur-[100px] rounded-full" />
         <div className="absolute bottom-10 right-10 w-64 h-64 bg-brand-success blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
           <Link to="/company/vault" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
             <ArrowLeft className="w-5 h-5" />
           </Link>
           <div className="text-right">
              <p className="text-[10px] font-black text-brand-success uppercase tracking-widest">Vault Registry</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Initialize Protocol_</p>
           </div>
        </div>

        <div className="p-10 space-y-8">
            <div className="text-center">
               <Logo size="lg" className="mx-auto mb-6 bg-white/10 p-4 rounded-2xl inline-flex" showText={false} />
               <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Authority Onboarding</h2>
               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 bg-white/5 py-2 rounded-lg">Default Role: CLIENTS // Status: INACTIVE</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-success transition-all uppercase"
                      placeholder="IDENTIFIER"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-success transition-all"
                      placeholder="+0 000 000 0000"
                    />
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-success transition-all"
                      placeholder="AUTH@VAULT.CORE"
                    />
                  </div>
               </div>

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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-success transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-success transition-colors"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-brand-success transition-all"
                      placeholder="••••••••"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Vault Access PIN</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-success" />
                    <input 
                      type="password" 
                      name="vaultPin"
                      required
                      value={formData.vaultPin}
                      onChange={handleChange}
                      className="w-full bg-brand-success/5 border border-brand-success/20 rounded-xl pl-12 pr-4 py-4 text-xs font-black text-brand-success focus:outline-none focus:border-brand-success transition-all"
                      placeholder="PIN CODE"
                    />
                  </div>
               </div>

               <Button
                 type="submit"
                 disabled={loading}
                 className="w-full h-14 bg-brand-success hover:bg-brand-success/90 transition-all text-xs font-black shadow-xl text-white"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "PROPOSE AUTHORITY LINK_"}
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
                  CRITICAL_FAILURE:: {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center">
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Submission of this registry proposal constitutes <br/> agreement to DT-Standard Security Protocols.</p>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
