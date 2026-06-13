import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Monitor, Loader2, ShieldCheck, LogOut, Search, Users } from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { db, collection, query, where, onSnapshot, orderBy, getDocs } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { revokeSessionByAdmin } from "../../lib/sessionService";

interface SessionDoc {
  id: string;
  userId: string;
  role: string;
  createdAt: any;
  expiresAt: string;
  lastActive: any;
  deviceInfo: string;
  active: boolean;
  revokedAt?: string;
  revokedBy?: string;
}
interface UserMap { [uid: string]: { username: string; email: string }; }

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-brand-success/10 text-brand-success",
  admin: "bg-brand-accent/10 text-brand-accent",
  user: "bg-slate-100 dark:bg-slate-800 text-slate-500",
};

export default function AdminSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [users, setUsers] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as SessionDoc[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    getDocs(collection(db, "users")).then(snap => {
      const map: UserMap = {};
      snap.docs.forEach(d => { map[d.id] = { username: d.data().username, email: d.data().email }; });
      setUsers(map);
    });
    getDocs(collection(db, "admins")).then(snap => {
      setUsers(prev => {
        const map = { ...prev };
        snap.docs.forEach(d => { map[d.id] = { username: d.data().username, email: d.data().email }; });
        return map;
      });
    });
  }, []);

  const handleRevoke = async (sessionId: string) => {
    if (!user) return;
    setRevoking(sessionId);
    try {
      await revokeSessionByAdmin(sessionId, user.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const getDeviceLabel = (info: string) => {
    if (info.includes("Mobile") || info.includes("Android") || info.includes("iPhone")) return "Mobile";
    if (info.includes("iPad") || info.includes("Tablet")) return "Tablet";
    return "Desktop";
  };

  const filtered = sessions.filter(s => {
    if (!searchQuery) return true;
    const u = users[s.userId];
    return u?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Active Sessions</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Active Sessions // {sessions.length} Live
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search user, role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all w-64"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Total Active", value: sessions.length },
          { label: "Users", value: sessions.filter(s => s.role === "user").length },
          { label: "Staff", value: sessions.filter(s => s.role !== "user").length },
        ].map((stat, i) => (
          <Card key={stat.label} className="border-none bg-white dark:bg-slate-900 shadow-md text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-4xl font-black text-brand-text-bold dark:text-white italic">{stat.value}</p>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-32 text-center opacity-30">
          <ShieldCheck className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
          <p className="text-xl font-black uppercase tracking-widest">No Active Sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session, i) => {
            const userInfo = users[session.userId];
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                            {userInfo?.username || session.userId.slice(0, 8)}
                          </p>
                          <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", ROLE_COLOR[session.role] || ROLE_COLOR.user)}>
                            {session.role.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[10px] font-mono text-slate-400 uppercase">
                          <span>{getDeviceLabel(session.deviceInfo)}</span>
                          <span>{getTimeRemaining(session.expiresAt)} left</span>
                          <span>Last: {session.lastActive?.toDate ? session.lastActive.toDate().toLocaleTimeString() : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevoke(session.id)}
                      disabled={revoking === session.id}
                      className="gap-2 text-[10px] border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                    >
                      {revoking === session.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                      Revoke
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
