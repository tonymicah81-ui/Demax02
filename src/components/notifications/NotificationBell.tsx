import { Bell } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/cn";

export function NotificationBell() {
  const [unreadCount] = useState(3); // Placeholder

  return (
    <div className="relative group cursor-pointer p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-brand-border dark:border-white/5">
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-sm animate-bounce">
          {unreadCount}
        </span>
      )}
    </div>
  );
}
