import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../AuthContext";
import {
  db, collection, query, where, onSnapshot, orderBy, doc, updateDoc
} from "../../firebase";
import { Conversation, Message, sendMessage, deleteMessage } from "../../lib/chatService";
import { ChatList } from "../../components/chat/ChatList";
import { ChatContainer } from "../../components/chat/ChatContainer";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatInput } from "../../components/chat/ChatInput";
import {
  MessageSquare, Users, Globe, Send, Loader2, X, Circle, ArrowRight, User as UserIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import {
  VisitorConversation, VisitorMessage,
  sendAdminReplyToVisitor, markVisitorMessagesRead, closeVisitorConversation
} from "../../lib/visitorChatService";
import { setAdminPresence } from "../../lib/adminPresence";
import { db as _db } from "../../firebase";
import { formatDistanceToNow } from "date-fns";

type MainTab = "clients" | "visitors";

function VisitorChatPanel({
  conv,
  adminId,
  adminName,
}: {
  conv: VisitorConversation;
  adminId: string;
  adminName: string;
}) {
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "visitor_messages"),
      where("visitorId", "==", conv.visitorId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as VisitorMessage[]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    markVisitorMessagesRead(conv.visitorId, "admin").catch(() => {});
    return () => unsub();
  }, [conv.visitorId]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      await sendAdminReplyToVisitor(conv.visitorId, msg, adminId, adminName);
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <p className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">{conv.name || "Visitor"}</p>
            {conv.email && <p className="text-[10px] text-slate-400 font-mono">{conv.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[9px] font-black uppercase px-2 py-1 rounded-lg",
            conv.status === "open" ? "bg-brand-success/10 text-brand-success" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
          )}>
            {conv.status}
          </span>
          {conv.status === "open" && (
            <button
              onClick={() => closeVisitorConversation(conv.visitorId)}
              className="px-3 py-1.5 text-[9px] font-black uppercase bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg hover:bg-red-100 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Close
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 opacity-30">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.sender === "admin" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[70%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed",
              msg.sender === "admin"
                ? "bg-brand-accent text-white rounded-br-sm"
                : "bg-white dark:bg-slate-800 text-brand-text-bold dark:text-white rounded-bl-sm shadow-sm border border-brand-border dark:border-white/5"
            )}>
              {msg.sender === "visitor" && (
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary dark:text-brand-accent mb-1">{conv.name}</p>
              )}
              <p>{msg.text}</p>
              <p className={cn("text-[9px] mt-1 opacity-60", msg.sender === "admin" ? "text-right" : "")}>
                {fmt(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {conv.status === "open" && (
        <form onSubmit={handleSend} className="flex-shrink-0 border-t border-brand-border dark:border-white/5 p-4 flex gap-2 bg-white dark:bg-slate-900">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Reply to visitor..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:outline-none dark:text-white"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-xl bg-brand-accent text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-accent/90 transition-all"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AdminChats() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<MainTab>("clients");

  // Client chat state
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Visitor chat state
  const [visitorConvs, setVisitorConvs] = useState<VisitorConversation[]>([]);
  const [selectedVisitorConv, setSelectedVisitorConv] = useState<VisitorConversation | null>(null);
  const [visitorSearch, setVisitorSearch] = useState("");

  // Set admin presence
  useEffect(() => {
    if (user && profile) {
      setAdminPresence(user.uid, profile.username || profile.email || "Admin", true);
      return () => { setAdminPresence(user.uid, profile.username || profile.email || "Admin", false); };
    }
  }, [user, profile]);

  // Subscribe to visitor conversations
  useEffect(() => {
    const q = query(collection(db, "visitor_conversations"), orderBy("lastMessageAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setVisitorConvs(snap.docs.map(d => ({ ...d.data() })) as VisitorConversation[]);
    });
    return () => unsub();
  }, []);

  // Subscribe to client messages
  useEffect(() => {
    if (!selectedConv) return;
    setLoadingMessages(true);
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", selectedConv.id),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]);
      setLoadingMessages(false);
    });
    updateDoc(doc(db, "conversations", selectedConv.id), { unreadCount: 0 }).catch(() => {});
    return () => unsub();
  }, [selectedConv?.id]);

  const handleSend = async (
    text: string,
    files?: { url: string; name: string; type: string }[],
    replyingMsg?: Message
  ) => {
    if (!selectedConv || !user) return;
    const messagePayload: Partial<Message> = {
      text,
      senderId: user.uid,
      senderRole: "admin",
      replyTo: replyingMsg?.id || "",
    };
    if (files && files.length > 0) messagePayload.file = files[0];
    await sendMessage(selectedConv.id, messagePayload, selectedConv.userId, selectedConv.userEmail, selectedConv.username);
    setReplyTo(null);
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!selectedConv) return;
    try { await updateDoc(doc(db, "conversations", selectedConv.id), { "typing.admin": isTyping }); } catch {}
  };

  const totalUnreadVisitors = visitorConvs.reduce((s, c) => s + (c.unreadAdmin || 0), 0);

  const filteredVisitorConvs = visitorConvs.filter(c =>
    !visitorSearch ||
    c.name?.toLowerCase().includes(visitorSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(visitorSearch.toLowerCase())
  );

  const fmtTime = (ts: any) => {
    if (!ts) return "";
    try { return formatDistanceToNow(new Date(ts.seconds * 1000)) + " ago"; } catch { return ""; }
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("clients")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === "clients"
              ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white"
          )}
        >
          <Users className="w-3.5 h-3.5" /> Client Messages
        </button>
        <button
          onClick={() => setTab("visitors")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            tab === "visitors"
              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-text-bold dark:hover:text-white"
          )}
        >
          <Globe className="w-3.5 h-3.5" /> Visitor Chats
          {totalUnreadVisitors > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center animate-pulse">
              {totalUnreadVisitors > 9 ? "9+" : totalUnreadVisitors}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "clients" && (
          <motion.div
            key="clients"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="h-[calc(100vh-180px)] flex bg-white dark:bg-slate-900 rounded-[32px] border border-brand-border dark:border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="w-80 lg:w-96 flex-shrink-0">
              <ChatList onSelect={(conv) => { setSelectedConv(conv); setReplyTo(null); setMessages([]); }} selectedId={selectedConv?.id} />
            </div>
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-slate-950/10 relative">
              <AnimatePresence mode="wait">
                {selectedConv ? (
                  <motion.div key={selectedConv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                    <ChatHeader
                      title={selectedConv.username || "Unknown User"}
                      status="online"
                      isAdminView={true}
                      isTyping={selectedConv.typing?.user}
                      onAvatarClick={() => navigate(`/admin/users/${selectedConv.userId}`)}
                    />
                    <ChatContainer
                      messages={messages}
                      currentUserId={user?.uid}
                      isAdminView={true}
                      onReply={(msg) => setReplyTo(msg)}
                      onDelete={(msgId) => deleteMessage(msgId)}
                      loading={loadingMessages}
                      isTyping={selectedConv.typing?.user}
                    />
                    <ChatInput onSend={handleSend} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} typingRef={handleTyping} />
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center gap-4 opacity-25">
                    <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-9 h-9 text-slate-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black uppercase tracking-tighter italic">Select a conversation</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Choose a user from the list to open their chat</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {tab === "visitors" && (
          <motion.div
            key="visitors"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="h-[calc(100vh-180px)] flex bg-white dark:bg-slate-900 rounded-[32px] border border-brand-border dark:border-white/5 overflow-hidden shadow-2xl"
          >
            {/* Visitor conversation list */}
            <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col border-r border-brand-border dark:border-white/5">
              <div className="p-6 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
                <h2 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic mb-4">
                  Visitor Chats
                </h2>
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={visitorSearch}
                  onChange={e => setVisitorSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredVisitorConvs.length === 0 ? (
                  <div className="p-10 text-center opacity-30">
                    <Globe className="w-10 h-10 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No visitor chats yet</p>
                    <p className="text-[9px] text-slate-400 mt-1">Chats will appear here when visitors use the widget</p>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border dark:divide-white/5">
                    {filteredVisitorConvs.map((conv) => (
                      <button
                        key={conv.visitorId}
                        onClick={() => setSelectedVisitorConv(conv)}
                        className={cn(
                          "w-full p-5 text-left flex items-center gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative",
                          selectedVisitorConv?.visitorId === conv.visitorId && "bg-brand-primary/5 dark:bg-brand-primary/10 border-l-4 border-brand-primary pl-4"
                        )}
                      >
                        <div className="relative w-11 h-11 flex-shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
                            conv.status === "open" ? "bg-brand-success" : "bg-slate-400"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight truncate">{conv.name || "Visitor"}</h3>
                            <span className="text-[8px] text-slate-400 font-mono shrink-0 ml-2">{fmtTime(conv.lastMessageAt)}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate italic">{conv.lastMessage || "No messages yet"}</p>
                          {conv.email && <p className="text-[9px] text-slate-400 font-mono truncate">{conv.email}</p>}
                        </div>
                        {(conv.unreadAdmin || 0) > 0 && (
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-black text-white animate-pulse shrink-0">
                            {conv.unreadAdmin}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visitor chat area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-slate-950/10">
              {selectedVisitorConv ? (
                <VisitorChatPanel
                  key={selectedVisitorConv.visitorId}
                  conv={selectedVisitorConv}
                  adminId={user?.uid || ""}
                  adminName={(profile as any)?.username || "Admin"}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-25">
                  <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center shadow-sm">
                    <Globe className="w-9 h-9 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-tighter italic">Select a visitor chat</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Choose a visitor from the list to view their conversation</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
