import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Bell, Clock, CheckCircle2, AlertTriangle, MessageSquare, Loader2, Info, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import { db, collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from "../../firebase";
import { cn } from "../../utils/cn";

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type?: "alert" | "chat" | "system" | "success" | "info";
  createdAt: any;
  read: boolean;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "user_notifications"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SystemNotification[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "user_notifications", notifId), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, "user_notifications", n.id), { read: true });
    });
    
    try {
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Awaiting Sync";
    const seconds = Math.floor((Date.now() - timestamp.seconds * 1000) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Signal Stream</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Automated Protocol Notifications // Alerts v2.1
          </p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="ghost" onClick={markAllRead} className="text-[10px] uppercase font-black tracking-widest gap-2 text-slate-500 hover:text-brand-accent">
            <CheckCircle2 className="w-4 h-4" /> CLEAR_UNREAD
          </Button>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {loading ? (
           <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Protocol Signals</p>
           </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={cn(
                    "group transition-all border relative overflow-hidden cursor-pointer",
                    n.read ? 'opacity-60 bg-transparent border-brand-border dark:border-white/5' : 
                    'border-brand-accent/40 bg-white dark:bg-slate-900 shadow-xl shadow-brand-accent/5 ring-1 ring-brand-accent/10'
                  )}
                >
                   <div className="flex gap-6 relative z-10">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                        n.type === 'alert' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        n.type === 'chat' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        n.type === 'success' ? 'bg-green-500/10 text-brand-success border-green-500/20' :
                        'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                      )}>
                         {n.type === 'alert' ? <AlertTriangle className="w-6 h-6" /> : 
                          n.type === 'chat' ? <MessageSquare className="w-6 h-6" /> : 
                          n.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                          <Bell className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic truncate pr-4">{n.title}</h3>
                            <span className="text-[9px] font-mono text-slate-400 uppercase whitespace-nowrap shrink-0">{getTimeAgo(n.createdAt)}</span>
                         </div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase italic leading-relaxed">{n.message}</p>
                         
                         {!n.read && (
                           <div className="mt-4 flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest italic">New Sequence Detected</span>
                              <ArrowRight className="w-3 h-3 text-brand-accent ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                           </div>
                         )}
                      </div>
                   </div>
                   <div className={cn(
                     "absolute inset-0 pointer-events-none transition-opacity duration-1000",
                     n.read ? "opacity-0" : "bg-gradient-to-r from-brand-accent/5 to-transparent"
                   )} />
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-32 text-center space-y-6 opacity-30 border-2 border-dashed border-brand-border dark:border-white/5 rounded-3xl">
             <Bell className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700 animate-pulse" />
             <div className="space-y-1">
                <p className="text-lg font-black uppercase tracking-[0.3em] italic">No Active Signals</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Awaiting central command transmission...</p>
             </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/5 flex gap-6 items-start">
         <Info className="w-6 h-6 text-brand-accent shrink-0 mt-1" />
         <div className="space-y-2">
            <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase italic tracking-tighter">Signal Integrity</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase italic">
              All protocol communications are encrypted and synchronized in real-time. Signals older than 30 cycles are archived in the primary data lake.
            </p>
         </div>
      </div>
    </div>
  );
}
