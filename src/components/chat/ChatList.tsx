import { useState, useEffect } from "react";
import { Search, MessageSquare, Clock, ArrowRight, User } from "lucide-react";
import { db, collection, query, where, onSnapshot, orderBy } from "../../firebase";
import { Conversation } from "../../lib/chatService";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";

export function ChatList({ onSelect, selectedId }: { onSelect: (conv: Conversation) => void, selectedId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "conversations"), orderBy("lastMessageAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[]);
    });
    return () => unsubscribe();
  }, []);

  const filtered = conversations.filter(c => 
    c.username?.toLowerCase().includes(search.toLowerCase()) || 
    c.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-r border-brand-border dark:border-white/5">
      <div className="p-6 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
         <h2 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic mb-4">Signal Hub</h2>
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="SEARCH_IDENTITY..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-accent transition-all"
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
         {filtered.length === 0 ? (
            <div className="p-10 text-center opacity-30">
               <MessageSquare className="w-10 h-10 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest">No Active Signals</p>
            </div>
         ) : (
            <div className="divide-y divide-brand-border dark:divide-white/5">
               {filtered.map((conv) => (
                  <button 
                    key={conv.id} 
                    onClick={() => onSelect(conv)}
                    className={cn(
                      "w-full p-6 text-left flex items-center gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative",
                      selectedId === conv.id && "bg-brand-accent/5 dark:bg-brand-accent/10 border-l-4 border-brand-accent px-5"
                    )}
                  >
                     <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <User className="w-6 h-6 text-slate-400" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic truncate">
                              {conv.username || "Unknown Entity"}
                           </h3>
                           <span className="text-[8px] font-mono text-slate-400 uppercase">
                              {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt.seconds * 1000)) + " ago" : ""}
                           </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium truncate italic">
                           {conv.lastMessage || "Awaiting transmission..."}
                        </p>
                     </div>
                     {conv.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-pulse">
                           {conv.unreadCount}
                        </div>
                     )}
                     <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-brand-accent transition-colors ml-2 flex-shrink-0" />
                  </button>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
