import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, MessageSquare, User, Users,
  Settings, ShieldAlert, ChevronRight, Wallet, Bell, Package,
  Wrench, Activity, SlidersHorizontal, Receipt, Monitor, CreditCard, Store,
  BookOpen, Bot, Mail, Tag, HelpCircle, BarChart2, UserCog, LogOut
} from "lucide-react";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { Logo } from "../ui/Logo";
import { db, collection, query, where, onSnapshot } from "../../firebase";
import { useState, useEffect } from "react";

function UnreadCountBadge({ isUserSide }: { isUserSide: boolean }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = isUserSide
      ? query(collection(db, "conversations"), where("userId", "==", user.uid))
      : query(collection(db, "conversations"), where("unreadCount", ">", 0));

    const unsubscribe = onSnapshot(q, (snap) => {
      const sum = snap.docs.reduce((acc, d) => acc + (d.data().unreadCount || 0), 0);
      setCount(sum);
    });

    return () => unsubscribe();
  }, [user, isUserSide]);

  if (count === 0) return null;

  return (
    <span className="bg-white text-brand-accent px-1.5 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow-sm min-w-[20px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Sidebar() {
  const { profile, isAdmin, isSuperAdmin, adminMode, setAdminMode } = useAuth();

  const userLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/support", label: "Chat Team", icon: MessageSquare },
    { to: "/subscription", label: "Subscription", icon: Package },
    { to: "/email/mail", label: "Email Service", icon: Mail },
    { to: "/bot", label: "Bot Service", icon: Bot },
    { to: "/help", label: "Help Center", icon: HelpCircle },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/store", label: "Public Store", icon: Store },
    { to: "/marketplace", label: "Marketplace", icon: ShoppingCart },
    { to: "/cart", label: "Cart", icon: ShoppingCart },
    { to: "/orders", label: "My Orders", icon: Receipt },
    { to: "/wallet", label: "Wallet", icon: Wallet },
    { to: "/sessions", label: "Sessions", icon: Monitor },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ];

  const adminLinks = [
    { to: "/admin", label: "Admin HQ", icon: ShieldAlert },
    { to: "/admin/mail", label: "Platform Mailer", icon: Mail },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/admin/kb", label: "Knowledge Base", icon: BookOpen },
    { to: "/admin/crm", label: "CRM — Leads", icon: BarChart2 },
    { to: "/admin/marketplace", label: "Market Control", icon: ShoppingCart },
    { to: "/admin/payments", label: "Payments", icon: Wallet },
    { to: "/admin/transactions", label: "Transactions", icon: CreditCard },
    { to: "/admin/sessions", label: "Sessions", icon: Monitor },
    { to: "/admin/fixes", label: "Bug Fixes", icon: Wrench },
    { to: "/admin/projects", label: "Operations", icon: Activity },
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/chats", label: "Messages", icon: MessageSquare },
    { to: "/admin/broadcast", label: "Broadcast", icon: Bell },
  ];

  const superAdminLinks = [
    { to: "/superadmin", label: "Super Authority", icon: Settings },
    { to: "/superadmin/admins", label: "Manage Admins", icon: ShieldAlert },
    { to: "/superadmin/audit", label: "Audit Logs", icon: Activity },
    { to: "/superadmin/settings", label: "Platform Settings", icon: SlidersHorizontal },
    { to: "/superadmin/coupons", label: "Coupon System", icon: Tag },
  ];

  const renderLinks = (links: any[]) => (
    <div className="space-y-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => cn(
            "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-widest group relative",
            isActive
              ? "bg-brand-accent text-white shadow-[0_10px_15px_-3px_rgba(59,130,246,0.3)]"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-text-bold dark:hover:text-white"
          )}
        >
          <div className="flex items-center gap-3">
            <link.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-[11px]">{link.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {(link.label === "Chat Team" || link.label === "Messages") && (
              <UnreadCountBadge isUserSide={link.label === "Chat Team"} />
            )}
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside className="w-72 h-screen bg-white dark:bg-slate-900 border-r border-brand-border dark:border-white/5 flex flex-col flex-shrink-0 relative z-20 overflow-y-auto">
      <div className="p-8 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 p-6 space-y-8">
        <div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] mb-4 ml-2">Personal Hub</p>
          {renderLinks(userLinks)}
        </div>

        {isAdmin && (
          <div>
            <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-4 ml-2">Admin Control</p>
            {renderLinks(adminLinks)}
          </div>
        )}

        {isSuperAdmin && (
          <div>
            <p className="text-[10px] font-black text-brand-success uppercase tracking-[0.3em] mb-4 ml-2">Super Authority</p>
            {renderLinks(superAdminLinks)}

            <button
              onClick={() => setAdminMode(!adminMode)}
              className={cn(
                "mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
                adminMode
                  ? "bg-brand-accent/10 border-brand-accent text-brand-accent"
                  : "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {adminMode ? <UserCog className="w-4 h-4" /> : <LogOut className="w-4 h-4 opacity-50" />}
              {adminMode ? "Admin Mode: ON" : "Switch to Admin Mode"}
            </button>
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-brand-border dark:border-white/5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-text-bold dark:text-white truncate uppercase tracking-tight">{profile?.username || "User"}</p>
            <p className="text-[10px] text-slate-500 truncate lowercase font-mono">{profile?.role || "user"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
