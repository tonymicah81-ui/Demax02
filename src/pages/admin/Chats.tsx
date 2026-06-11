import { useState, useEffect } from "react";
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
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminChats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Subscribe to messages for selected conversation
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

    // Mark conversation as read when opened
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

    if (files && files.length > 0) {
      messagePayload.file = files[0];
    }

    await sendMessage(
      selectedConv.id,
      messagePayload,
      selectedConv.userId,
      selectedConv.userEmail,
      selectedConv.username
    );
    setReplyTo(null);
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!selectedConv) return;
    try {
      await updateDoc(doc(db, "conversations", selectedConv.id), {
        "typing.admin": isTyping,
      });
    } catch {}
  };

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    setReplyTo(null);
    setMessages([]);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex bg-white dark:bg-slate-900 rounded-[32px] border border-brand-border dark:border-white/5 overflow-hidden shadow-2xl">
      {/* Sidebar — conversation list */}
      <div className="w-80 lg:w-96 flex-shrink-0">
        <ChatList
          onSelect={handleSelectConv}
          selectedId={selectedConv?.id}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-slate-950/10 relative">
        <AnimatePresence mode="wait">
          {selectedConv ? (
            <motion.div
              key={selectedConv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
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

              <ChatInput
                onSend={handleSend}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                typingRef={handleTyping}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 opacity-25"
            >
              <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center shadow-sm">
                <MessageSquare className="w-9 h-9 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-tighter italic">Select a conversation</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Choose a user from the list to open their chat
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
