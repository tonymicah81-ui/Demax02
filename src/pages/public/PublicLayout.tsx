import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ShoppingCart, Moon, Sun, Store } from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import { useTheme } from "../../ThemeContext";
import { useAuth } from "../../AuthContext";
import { getOrCreateVisitorId } from "../../lib/visitorCart";
import { db, collection, query, where, onSnapshot } from "../../firebase";

export default function PublicLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitorCartCount, setVisitorCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      setVisitorCartCount(0);
      return;
    }
    const visitorId = getOrCreateVisitorId();
    const q = query(collection(db, "visitor_carts"), where("visitorId", "==", visitorId));
    const unsub = onSnapshot(q, (snap) => setVisitorCartCount(snap.size));
    return () => unsub();
  }, [user]);

  const cartCount = user ? 0 : visitorCartCount;

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex flex-col">
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-brand-border dark:border-white/5 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="sm" />
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/store")}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-accent transition-colors"
            >
              <Store className="w-4 h-4" /> Browse Store
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={() => navigate(user ? "/cart" : "/store")}
              className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-accent hover:text-white transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-brand-primary dark:bg-brand-accent text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-brand-border dark:border-white/10">
                <button
                  onClick={() => navigate("/login")}
                  className="text-xs font-black uppercase tracking-widest text-brand-text-bold dark:text-white hover:text-brand-accent transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-brand-primary dark:bg-brand-accent text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => navigate(user ? "/cart" : "/store")}
              className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            {!user && (
              <button
                onClick={() => navigate("/login")}
                className="bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-black uppercase"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
}
