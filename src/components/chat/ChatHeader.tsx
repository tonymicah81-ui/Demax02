import { format, isToday, isYesterday } from "date-fns";
import { User, Shield, ExternalLink } from "lucide-react";
import { cn } from "../../utils/cn";

export function ChatHeader({ 
  title, 
  status, 
  isTyping, 
  isAdminView,
  userProfilePic,
  onAvatarClick
}: { 
  title: string, 
  status?: string, 
  isTyping?: boolean, 
  isAdminView?: boolean,
  userProfilePic?: string,
  onAvatarClick?: () => void
}) {
  return (
    <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-brand-border dark:border-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
      <div className="flex items-center gap-4">
        <div 
          onClick={onAvatarClick}
          className={cn(
            "w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-brand-border dark:border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 border transition-all",
            isAdminView && "cursor-pointer hover:border-brand-accent hover:shadow-lg"
          )}
        >
          {userProfilePic ? (
            <img src={userProfilePic} alt="Identity" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            isAdminView ? <User className="w-6 h-6 text-slate-400" /> : <Shield className="w-6 h-6 text-brand-accent" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic truncate">{title}</h2>
            {isAdminView && <ExternalLink className="w-3 h-3 text-slate-400" />}
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", status === 'online' ? "bg-brand-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-300")} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {isTyping ? "Transmitting Activity..." : (status || "Protocol_Standby")}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
         <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Secure Tunnel</p>
            <p className="text-[10px] font-mono text-brand-accent uppercase font-black tracking-widest italic leading-none truncate">End-to-End Relay</p>
         </div>
      </div>
    </div>
  );
}

export function ChatDateSeparator({ date }: { date: Date }) {
  let label = format(date, 'MMMM d, yyyy');
  if (isToday(date)) label = "Today's Protocol";
  else if (isYesterday(date)) label = "Yesterday's Protocol";

  return (
    <div className="flex items-center gap-4 my-8 opacity-40">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-400/50" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-400/50" />
    </div>
  );
}
