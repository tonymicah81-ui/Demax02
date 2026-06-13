import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Monitor, Clock, ShieldCheck, Loader2, LogOut, AlertCircle } from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { db, collection, query, where, onSnapshot, orderBy } from "../../firebase";
import { revokeSession, getCurrentSessionId } from "../../lib/sessionService";

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
}

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const currentSessionId = getCurrentSessionId();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as SessionDoc[]);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleRevoke = async (sessionId: string) => {
    if (sessionId === currentSessionId) {
      if (!confirm("Revoking your current session will log you out. Continue?")) return;
    }
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      if (sessionId === currentSessionId) {
        window.location.href = "/login";
      }
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
    return `${h}h ${m}m remaining`;
  };

  const getDeviceLabel = (info: string) => {
    if (info.includes("Mobile") || info.includes("Android") || info.includes("iPhone")) return "Mobile Device";
    if (info.includes("Tablet") || info.includes("iPad")) return "Tablet";
    return "Desktop Browser";
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Active Sessions</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Active Sessions // {sessions.length} Session(s)
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="py-32 text-center space-y-6 opacity-30">
          <ShieldCheck className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-xl font-black uppercase tracking-widest">No Active Sessions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, i) => {
            const isCurrent = session.id === currentSessionId;
            const expiresSoon = new Date(session.expiresAt).getTime() - Date.now() < 2 * 60 * 60 * 1000;
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn(
                  "border-none bg-white dark:bg-slate-900 shadow-md",
                  isCurrent && "ring-2 ring-brand-accent ring-offset-2 dark:ring-offset-slate-950"
                )}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border",
                        isCurrent
                          ? "bg-brand-accent/10 border-brand-accent/30 text-brand-accent"
                          : "bg-slate-50 dark:bg-slate-800 border-brand-border dark:border-white/5 text-slate-400"
                      )}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                            {getDeviceLabel(session.deviceInfo)}
                          </p>
                          {isCurrent && (
                            <span className="text-[8px] font-black bg-brand-accent text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Current</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-400 uppercase">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeRemaining(session.expiresAt)}
                          </span>
                          <span>
                            Created: {session.createdAt?.toDate ? session.createdAt.toDate().toLocaleDateString() : "—"}
                          </span>
                        </div>
                        {expiresSoon && !isCurrent && (
                          <div className="flex items-center gap-1 mt-1 text-amber-500 text-[10px] font-black uppercase">
                            <AlertCircle className="w-3 h-3" /> Expires Soon
                          </div>
                        )}
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
                      {isCurrent ? "Sign Out" : "Revoke"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Card className="border border-brand-accent/20 bg-brand-accent/5">
        <div className="flex items-center gap-3 text-brand-accent mb-3">
          <ShieldCheck className="w-5 h-5" />
          <CardTitle className="text-brand-accent uppercase italic tracking-tighter text-sm">Session Security</CardTitle>
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">
          Each session expires after 48 hours. If you notice an unfamiliar session, revoke it immediately and change your password. Sessions are tied to your login and are automatically cleaned up on expiry.
        </p>
      </Card>
    </div>
  );
}
