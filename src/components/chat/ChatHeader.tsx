import { format, isToday, isYesterday } from "date-fns";
import { User, Shield, ExternalLink } from "lucide-react";
import { cn } from "../../utils/cn";

interface ChatHeaderProps {
  title: string;
  status?: string;
  isTyping?: boolean;
  isAdminView?: boolean;
  userProfilePic?: string;
  onAvatarClick?: () => void;
}

export function ChatHeader({
  title,
  status,
  isTyping,
  isAdminView,
  userProfilePic,
  onAvatarClick,
}: ChatHeaderProps) {
  return (
    <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-brand-border dark:border-white/5 flex items-center justify-between flex-shrink-0 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          onClick={onAvatarClick}
          className={cn(
            "w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all",
            isAdminView && onAvatarClick && "cursor-pointer hover:border-brand-accent hover:shadow-md hover:scale-105"
          )}
        >
          {userProfilePic ? (
            <img src={userProfilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : isAdminView ? (
            <User className="w-5 h-5 text-slate-400" />
          ) : (
            <Shield className="w-5 h-5 text-brand-accent" />
          )}
        </div>

        {/* Name + status */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic truncate">
              {title}
            </h2>
            {isAdminView && onAvatarClick && (
              <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                status === "online"
                  ? "bg-brand-success animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                  : "bg-slate-300"
              )}
            />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {isTyping ? "typing..." : status || "offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Right side label */}
      <div className="hidden md:block text-right">
        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
          Encrypted Channel
        </p>
      </div>
    </div>
  );
}

// ─── Date separator ──────────────────────────────────────────────────────────
export function ChatDateSeparator({ date }: { date: Date }) {
  let label: string;
  if (isToday(date)) label = "Today";
  else if (isYesterday(date)) label = "Yesterday";
  else label = format(date, "MMMM d, yyyy");

  return (
    <div className="flex items-center gap-3 my-6 opacity-40">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-700" />
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-700" />
    </div>
  );
}
