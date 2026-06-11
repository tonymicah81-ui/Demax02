import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { Loader2 } from "lucide-react";

export function UserProtectedRoute() {
  const { user, profile, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg dark:bg-slate-950 text-brand-accent">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.status === 'inactive' && !isSuperAdmin) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg dark:bg-slate-950 p-6 text-center">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center mb-8 border-2 border-amber-200 dark:border-amber-900/30">
          <Loader2 className="w-12 h-12 text-amber-500 animate-[spin_4s_linear_infinite]" />
        </div>
        <h1 className="text-3xl font-black text-brand-text-bold dark:text-white mb-3 uppercase tracking-tight italic">Protocol Locked</h1>
        <p className="text-brand-text dark:text-slate-400 max-w-md font-medium leading-relaxed">
          Your account status is currently <span className="text-amber-500 font-black italic">INACTIVE</span>. 
          Contact management to initialize your data access protocol.
        </p>
        <p className="text-slate-500 mt-6 text-[10px] font-mono uppercase tracking-widest border border-brand-border dark:border-white/10 px-4 py-2 rounded-full">
          Identity verified: <span className="text-brand-accent">{user.email}</span>
        </p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="mt-10 px-8 py-3 bg-brand-primary dark:bg-brand-accent text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-brand-accent/20"
        >
          Back to Public Hub
        </button>
      </div>
    );
  }

  return <Outlet />;
}
