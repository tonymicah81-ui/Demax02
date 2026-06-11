import { Sun, Moon, LogOut, Bell, Search } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { useTheme } from "../../ThemeContext";
import { Button } from "../ui/Button";
import { NotificationBell } from "../notifications/NotificationBell";

export function Topbar() {
  const { signout, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-brand-border dark:border-white/5 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-accent transition-colors" />
          <input 
            type="text" 
            placeholder="SYSTEM_SEARCH_PROTOCOL..." 
            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-xs font-mono text-brand-text-bold dark:text-white focus:outline-none focus:border-brand-accent transition-all uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono hidden md:block">CMD + K</div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell />

        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-brand-border dark:border-white/5"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="h-10 w-px bg-brand-border dark:bg-white/5 hidden md:block" />

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tighter truncate max-w-[120px]">
              {profile?.username || "Authorized User"}
            </p>
            <p className="text-[9px] font-black text-brand-accent uppercase tracking-[0.2em] animate-pulse">
              ROLE::{profile?.role || "standard"}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => signout()}
            className="h-10 w-10 p-0 border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
