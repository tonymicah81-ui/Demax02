import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { Loader2 } from "lucide-react";

export function AdminRoute() {
  const { isAdmin, isSuperAdmin, adminMode, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg dark:bg-slate-950 text-brand-accent">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!isAdmin && !(isSuperAdmin && adminMode)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
