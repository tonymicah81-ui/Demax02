import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Moon, Sun, Store, Menu, X, Bot, Mail, Globe } from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import { useTheme } from "../../ThemeContext";
import { useAuth } from "../../AuthContext";
import { getOrCreateVisitorId } from "../../lib/visitorCart";
import { db, collection, query, where, onSnapshot } from "../../firebase";
import { motion, AnimatePresence } from "motion/react";

export default function PublicLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitorCartCount, setVisitorCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) { setVisitorCartCount(0); return; }
    const visitorId = getOrCreateVisitorId();
    const q = query(collection(db, "visitor_carts"), where("visitorId", "==", visitorId));
    const unsub = onSnapshot(q, (snap) => setVisitorCartCount(snap.size));
    return () => unsub();
  }, [user]);

  const cartCount = user ? 0 : visitorCartCount;

  const NAV_LINKS = [
    { label: "Browse Store", href: "/store", icon: Store },
    { label: "Services", href: "/#services", icon: Globe },
    { label: "Telegram Bots", href: "/#plans", icon: Bot },
    { label: "Email Plans", href: "/#plans", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex flex-col">
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-brand-border dark:border-white/5 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="sm" />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <button onClick={() => navigate("/store")} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-accent transition-colors">
              <Store className="w-4 h-4" /> Browse Store
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button onClick={() => navigate(user ? "/cart" : "/store")} className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand-accent hover:text-white transition-colors">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            {user ? (
              <button onClick={() => navigate("/dashboard")} className="bg-brand-primary dark:bg-brand-accent text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm">
                Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-brand-border dark:border-white/10">
                <button onClick={() => navigate("/login")} className="text-xs font-black uppercase tracking-widest text-brand-text-bold dark:text-white hover:text-brand-accent transition-colors">
                  Login
                </button>
                <button onClick={() => navigate("/signup")} className="bg-brand-primary dark:bg-brand-accent text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm">
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => navigate(user ? "/cart" : "/store")} className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl md:hidden border-l border-brand-border dark:border-white/5"
            >
              <div className="flex items-center justify-between p-5 border-b border-brand-border dark:border-white/5">
                <Logo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV_LINKS.map(item => (
                  <button key={item.label} onClick={() => { navigate(item.href); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-brand-text dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                    <item.icon className="w-4 h-4 text-brand-accent shrink-0" />
                    {item.label}
                  </button>
                ))}
                <button onClick={() => { navigate("/terms"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-brand-text dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  Terms / Legal
                </button>

                <div className="pt-2">
                  <button onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-brand-text dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {theme === "light" ? <><Moon className="w-4 h-4 text-slate-400 shrink-0" /> Dark Mode</> : <><Sun className="w-4 h-4 text-amber-400 shrink-0" /> Light Mode</>}
                  </button>
                </div>
              </div>

              <div className="p-5 border-t border-brand-border dark:border-white/5 space-y-3">
                {user ? (
                  <button onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}
                    className="block w-full text-center py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-brand-primary dark:bg-brand-accent text-white hover:opacity-90 transition-all shadow-sm">
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                      className="block w-full text-center py-3 rounded-xl text-sm font-black uppercase tracking-widest border-2 border-brand-border dark:border-white/10 text-brand-text-bold dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Login
                    </button>
                    <button onClick={() => { navigate("/signup"); setMobileMenuOpen(false); }}
                      className="block w-full text-center py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-brand-primary dark:bg-brand-accent text-white hover:opacity-90 transition-all shadow-sm">
                      Sign Up Free
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-16">
        <Outlet />
      </main>
    </div>
  );
}
