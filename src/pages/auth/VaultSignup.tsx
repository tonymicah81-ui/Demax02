import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export default function VaultSignup() {
  const { user, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    setError("");
    try {
      await register(formData, 'admin');
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-success transition-all placeholder:text-slate-600";

  if (success) {
    return (
      <div className="min-h-screen bg-brand-primary dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-brand-success blur-[100px] rounded-full" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-brand-accent blur-[100px] rounded-full" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl p-8 sm:p-12 text-center space-y-6 relative z-10"
        >
          <div className="w-16 h-16 rounded-full bg-brand-success/10 border border-brand-success/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-brand-success" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Registration Submitted</h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Your account is currently <strong className="text-amber-400">inactive</strong>. A Super Admin must authorize your credentials before you can access the dashboard.
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What happens next</p>
            <p className="text-[11px] text-slate-400">1. Super Admin reviews your registration</p>
            <p className="text-[11px] text-slate-400">2. Your account is activated</p>
            <p className="text-[11px] text-slate-400">3. You can then log in via Vault Login</p>
          </div>
          <Button
            onClick={() => navigate("/company/vault")}
            className="w-full h-12 bg-brand-success hover:bg-brand-success/90 text-white font-black text-[10px] uppercase tracking-widest"
          >
            Return to Vault
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-primary dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-brand-text transition-colors duration-500 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-brand-accent blur-[100px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-brand-success blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900 border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-5 sm:p-8 border-b border-white/5 flex items-center justify-between">
          <Link to="/company/vault" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black text-brand-success uppercase tracking-widest">Vault Registry</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Staff Registration</p>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-6">
          <div className="text-center">
            <Logo size="lg" className="mx-auto mb-5 bg-white/10 p-4 rounded-2xl inline-flex" showText={false} />
            <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter">Staff Registration</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">Requires Super Admin approval to activate</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" name="username" required value={formData.username} onChange={handleChange} className={inputClass} placeholder="Your name" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} className={inputClass} placeholder="+0 000 000 0000" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="staff@email.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className={inputClass + " pr-12"} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-success transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className={inputClass} placeholder="••••••••" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-brand-success hover:bg-brand-success/90 transition-all text-sm font-black shadow-xl text-white"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Registration"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              Already registered?{" "}
              <Link to="/company/vault/login" className="text-brand-accent hover:underline">Login here</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
