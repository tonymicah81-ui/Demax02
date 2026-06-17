import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { auth, doc, getDoc, db } from "../../firebase";

export default function StaffLogin() {
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
      await signin(email, password);

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Sign-in failed. Please try again.");

      const adminRef = doc(db, 'admins', uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        await signout();
        throw new Error("Staff account not found. Contact your administrator.");
      }

      const data = adminSnap.data();
      if (data.status === 'inactive') {
        await signout();
        throw new Error("Your account is pending approval. Contact your administrator.");
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-brand-text transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-brand-border dark:border-white/5 overflow-hidden">
          <div className="p-8 sm:p-12 text-center bg-brand-accent/5 dark:bg-brand-accent/10 border-b border-brand-border dark:border-white/5">
            <Logo size="lg" className="mx-auto mb-5 bg-white dark:bg-slate-800 p-4 rounded-3xl inline-flex shadow-lg" showText={false} />
            <h1 className="text-2xl sm:text-3xl font-black text-brand-text-bold dark:text-white tracking-tighter uppercase italic">Staff Portal</h1>
            <p className="text-slate-500 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">Internal Access</p>
          </div>

          <div className="p-6 sm:p-12 space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="staff@durex.team"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-14 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-accent transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-brand-primary dark:bg-brand-accent font-black uppercase tracking-[0.2em] shadow-xl text-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <Link to="/company/vault" className="text-[10px] font-black text-slate-400 hover:text-brand-accent uppercase tracking-widest transition-colors">
                ← Back to Vault
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] opacity-40">Durex Team · Staff Portal</p>
      </motion.div>
    </div>
  );
}
