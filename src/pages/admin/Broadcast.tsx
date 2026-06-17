import { useState, useEffect } from "react";
import { 
  Send, 
  Users, 
  User, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Loader2,
  Search,
  Check
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { db, collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { logAudit } from "../../lib/audit";
import { motion, AnimatePresence } from "motion/react";

export default function BroadcastSystem() {
  const { user } = useAuth();
  const [targetType, setTargetType] = useState<"all" | "selective">("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "alert" | "success">("info");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const q = query(collection(db, "users"), where("email", "==", searchQuery.trim()));
    const snap = await getDocs(q);
    setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const toggleUserSelection = (u: any) => {
    if (selectedUsers.find(item => item.uid === u.uid)) {
      setSelectedUsers(selectedUsers.filter(item => item.uid !== u.uid));
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setSubmitting(true);

    try {
      if (targetType === "all") {
        await addDoc(collection(db, "user_notifications"), {
          userId: "all",
          title,
          message,
          type: notifType,
          read: false,
          createdAt: serverTimestamp()
        });
        logAudit(user as any, "BROADCAST_SENT", `Global notification: ${title}`, "all", "notification");
      } else {
        const batch = writeBatch(db);
        selectedUsers.forEach(u => {
          const newNotifRef = doc(collection(db, "user_notifications"));
          batch.set(newNotifRef, {
            userId: u.uid,
            title,
            message,
            type: notifType,
            read: false,
            createdAt: serverTimestamp()
          });
        });
        await batch.commit();
        logAudit(user as any, "BROADCAST_SENT", `Targeted notification (${selectedUsers.length} users): ${title}`, "multiple", "notification");
      }
      
      setSuccess(true);
      setTitle("");
      setMessage("");
      setSelectedUsers([]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Broadcast</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Send announcements to users
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-6">
            <Card className="space-y-8">
               <form onSubmit={handleBroadcast} className="space-y-6">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Broadcast Type</label>
                     <div className="grid grid-cols-2 gap-4">
                        <button 
                          type="button" 
                          onClick={() => setTargetType("all")} 
                          className={cn("p-4 rounded-2xl border-2 transition-all flex items-center gap-3", targetType === "all" ? "border-brand-accent bg-brand-accent/5 text-brand-accent" : "border-brand-border dark:border-white/5 text-slate-500")}
                        >
                           <Users className="w-5 h-5" />
                           <span className="text-xs font-black uppercase italic">All Users</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setTargetType("selective")} 
                          className={cn("p-4 rounded-2xl border-2 transition-all flex items-center gap-3", targetType === "selective" ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-brand-border dark:border-white/5 text-slate-500")}
                        >
                           <User className="w-5 h-5" />
                           <span className="text-xs font-black uppercase italic">Specific User</span>
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Notification Type</label>
                        <div className="flex gap-4">
                           {["info", "alert", "success"].map(type => (
                             <button 
                               key={type}
                               type="button"
                               onClick={() => setNotifType(type as any)}
                               className={cn(
                                 "flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest italic",
                                 notifType === type 
                                  ? (type === 'alert' ? "bg-red-500 text-white border-red-500" : type === 'success' ? "bg-brand-success text-white border-brand-success" : "bg-brand-accent text-white border-brand-accent")
                                  : "border-brand-border dark:border-white/5 text-slate-400"
                               )}
                             >
                               {type === 'alert' ? <AlertTriangle className="w-3.5 h-3.5" /> : type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                               {type}
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Title</label>
                        <input 
                          type="text" 
                          required 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Announcement title..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Message</label>
                        <textarea 
                          required 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write your announcement..."
                          className="w-full min-h-[120px] bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold uppercase tracking-widest resize-none focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                        />
                     </div>
                  </div>

                  <Button type="submit" disabled={submitting || (targetType === 'selective' && selectedUsers.length === 0)} className="w-full h-14 relative overflow-hidden">
                     {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                      success ? (
                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-2">
                           <CheckCircle2 className="w-5 h-5" /> 
                           <span>Broadcast Sent</span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-2">
                           <Send className="w-5 h-5" /> 
                           <span>Send Broadcast</span>
                        </div>
                      )}
                  </Button>
               </form>
            </Card>
         </div>

         <div className="space-y-6">
            <AnimatePresence>
               {targetType === "selective" && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <Card className="space-y-6">
                       <CardTitle className="text-xs uppercase italic tracking-tighter">Select Users</CardTitle>
                       
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search by email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                          />
                       </div>

                       <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {searchResults.map(u => (
                            <button 
                              key={u.uid} 
                              onClick={() => toggleUserSelection(u)}
                              className={cn(
                                "w-full p-3 rounded-xl border flex items-center justify-between transition-all",
                                selectedUsers.find(i => i.uid === u.uid) ? "bg-brand-primary/10 border-brand-primary text-brand-primary" : "bg-slate-50 dark:bg-slate-950 border-brand-border dark:border-white/5 text-slate-500"
                              )}
                            >
                               <div className="text-left">
                                  <p className="text-[10px] font-black uppercase truncate">{u.username || "User"}</p>
                                  <p className="text-[9px] font-mono opacity-50">{u.email}</p>
                               </div>
                               {selectedUsers.find(i => i.uid === u.uid) && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                          {searchResults.length === 0 && searchQuery && (
                            <p className="text-[10px] text-center text-slate-400 py-4 italic font-bold">No results found...</p>
                          )}
                       </div>

                       {selectedUsers.length > 0 && (
                         <div className="pt-4 border-t border-brand-border dark:border-white/5">
                            <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-3">Selected: {selectedUsers.length}</p>
                            <div className="flex flex-wrap gap-2">
                               {selectedUsers.map(u => (
                                 <span key={u.uid} className="px-2 py-1 bg-brand-primary/10 rounded-lg text-[9px] font-mono text-brand-primary flex items-center gap-1">
                                    {u.email.split('@')[0]}
                                    <button onClick={() => toggleUserSelection(u)} className="hover:text-red-500">×</button>
                                 </span>
                               ))}
                            </div>
                         </div>
                       )}
                    </Card>
                 </motion.div>
               )}
            </AnimatePresence>

            <Card className="bg-slate-900 border-none relative overflow-hidden">
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3 text-brand-accent">
                     <Bell className="w-5 h-5" />
                     <CardTitle className="text-white text-xs uppercase italic tracking-tighter">Broadcast Log</CardTitle>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase italic">
                    Broadcasts are permanent records. Targeted messages go to specific users; global broadcasts reach all users.
                  </p>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
