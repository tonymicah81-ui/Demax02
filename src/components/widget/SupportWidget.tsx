import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";
import {
  getVisitorId, startVisitorConversation, sendVisitorMessage,
  markVisitorMessagesRead, VisitorMessage
} from "../../lib/visitorChatService";
import { subscribeToAnyAdminOnline } from "../../lib/adminPresence";
import { db, collection, query, where, onSnapshot, orderBy, doc } from "../../firebase";

const FALLBACK_LOGO = "/WA_1776458003470.jpeg";

export function SupportWidget({ source = "website" }: { source?: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "chat">("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [starting, setStarting] = useState(false);
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [unread, setUnread] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string>(FALLBACK_LOGO);
  const bottomRef = useRef<HTMLDivElement>(null);
  const visitorId = getVisitorId();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "platform_settings", "branding"), (snap) => {
      if (snap.exists()) {
        const url = snap.data()?.logoUrl;
        setLogoUrl(url || FALLBACK_LOGO);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToAnyAdminOnline(setAdminOnline);
    return () => unsub();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("dt_widget_started");
    if (stored) {
      const parsed = JSON.parse(stored);
      setName(parsed.name || "");
      setEmail(parsed.email || "");
      setStep("chat");
    }
  }, []);

  useEffect(() => {
    if (step !== "chat") return;
    const q = query(
      collection(db, "visitor_messages"),
      where("visitorId", "==", visitorId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as VisitorMessage[];
      setMessages(msgs);
      const newUnread = msgs.filter(m => m.sender === "admin" && !m.read).length;
      if (open) {
        setUnread(0);
        markVisitorMessagesRead(visitorId, "visitor").catch(() => {});
      } else {
        setUnread(newUnread);
      }
    });
    return () => unsub();
  }, [step, visitorId, open]);

  useEffect(() => {
    if (open && unread > 0) {
      setUnread(0);
      markVisitorMessagesRead(visitorId, "visitor").catch(() => {});
    }
  }, [open, unread, visitorId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStarting(true);
    try {
      await startVisitorConversation(visitorId, name.trim(), email.trim(), source);
      localStorage.setItem("dt_widget_started", JSON.stringify({ name: name.trim(), email: email.trim() }));
      setStep("chat");
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      await sendVisitorMessage(visitorId, msg);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const fmt = (ts: any) => {
    if (!ts) return "";
    try { return new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <>
      <style>{`
        @keyframes glowCycle {
          0%   { box-shadow: 0 0 16px 4px rgba(34,197,94,0.7), 0 0 32px 8px rgba(34,197,94,0.3); }
          33%  { box-shadow: 0 0 16px 4px rgba(6,182,212,0.7), 0 0 32px 8px rgba(6,182,212,0.3); }
          66%  { box-shadow: 0 0 16px 4px rgba(59,130,246,0.7), 0 0 32px 8px rgba(59,130,246,0.3); }
          100% { box-shadow: 0 0 16px 4px rgba(34,197,94,0.7), 0 0 32px 8px rgba(34,197,94,0.3); }
        }
        .fab-glow { animation: glowCycle 3s ease-in-out infinite; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              className="w-[340px] sm:w-[380px] h-[520px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-brand-primary p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_LOGO; }}
                      />
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-brand-primary",
                      adminOnline ? "bg-brand-success animate-pulse" : "bg-slate-400"
                    )} />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-tight">Support Chat</p>
                    <p className={cn("text-xs font-bold", adminOnline ? "text-green-300" : "text-slate-300")}>
                      {adminOnline ? "● Online" : "○ Away — we'll reply soon"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {step === "intro" ? (
                <form onSubmit={handleStart} className="flex-1 flex flex-col p-6 justify-center space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 overflow-hidden flex items-center justify-center mx-auto mb-3">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_LOGO; }}
                      />
                    </div>
                    <h3 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                      Start a Conversation
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      We usually reply within a few minutes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Your Name *</label>
                      <input
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email <span className="font-normal normal-case">(optional)</span></label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!name.trim() || starting}
                    className="w-full h-12 bg-brand-primary hover:bg-brand-primary/90 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Chatting →"}
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-[11px] text-slate-400 font-medium italic">
                          Hi {name}! 👋 Send us a message and we'll get back to you shortly.
                        </p>
                      </div>
                    )}
                    {messages.map(msg => (
                      <div key={msg.id} className={cn("flex", msg.sender === "visitor" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed",
                          msg.sender === "visitor"
                            ? "bg-brand-primary text-white rounded-br-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-brand-text-bold dark:text-white rounded-bl-sm"
                        )}>
                          {msg.sender === "admin" && msg.senderName && (
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-accent mb-1">{msg.senderName}</p>
                          )}
                          <p>{msg.text}</p>
                          <p className={cn("text-[9px] mt-1 opacity-60", msg.sender === "visitor" ? "text-right" : "")}>
                            {fmt(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                    <input
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:outline-none dark:text-white"
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e as any);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || sending}
                      className="w-11 h-11 rounded-xl bg-brand-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-primary/90 transition-all"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB with glow */}
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className={cn(
            "relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center",
            !open && "fab-glow"
          )}
          style={{ background: "linear-gradient(135deg, #22c55e 0%, #06b6d4 50%, #3b82f6 100%)" }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6 text-white" />
              </motion.span>
            ) : (
              <motion.span key="logo" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
                className="w-full h-full flex items-center justify-center"
              >
                <img
                  src={logoUrl}
                  alt="Chat"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK_LOGO; }}
                />
              </motion.span>
            )}
          </AnimatePresence>
          {!open && unread > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-bounce">
              {unread}
            </div>
          )}
          {!open && adminOnline && (
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-brand-success rounded-full border-2 border-white" />
          )}
        </motion.button>
      </div>
    </>
  );
}
