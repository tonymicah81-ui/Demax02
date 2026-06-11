import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../AuthContext";
import { db, collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, serverTimestamp } from "../../firebase";
import { Conversation, Message, sendMessage, editMessage, deleteMessage } from "../../lib/chatService";
import { ChatList } from "../../components/chat/ChatList";
import { ChatContainer } from "../../components/chat/ChatContainer";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatInput } from "../../components/chat/ChatInput";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminChats() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!selectedConv) return;
    
    setLoadingMessages(true);
    const q = query(
      collection(db, "messages"), 
      where("conversationId", "==", selectedConv.id),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
      setLoadingMessages(false);
    });

    // Mark as read
    updateDoc(doc(db, "conversations", selectedConv.id), { unreadCount: 0 });

    return () => unsubscribe();
  }, [selectedConv]);

  const handleSend = async (text: string, files?: any[], replyingMsg?: any) => {
    if (!selectedConv || !user) return;
    
    const messagePayload: Partial<Message> = {
      text,
      senderId: user.uid,
      senderRole: "admin",
      replyTo: replyingMsg?.id || "",
    };

    if (files && files.length > 0) {
       messagePayload.file = files[0]; // Simplified for now
    }

    await sendMessage(selectedConv.id, messagePayload, selectedConv.userId, selectedConv.userEmail, selectedConv.username);
    setReplyTo(null);
  };

  const setTypingStatus = async (typing: boolean) => {
    if (!selectedConv) return;
    await updateDoc(doc(db, "conversations", selectedConv.id), {
      "typing.admin": typing
    });
  };

  return (
    <div className="h-[calc(100vh-100px)] flex bg-white dark:bg-slate-900 rounded-[32px] border border-brand-border dark:border-white/5 overflow-hidden shadow-2xl">
      {/* Sidebar List */}
      <div className="w-80 lg:w-96 flex-shrink-0">
        <ChatList 
          onSelect={(conv) => setSelectedConv(conv)} 
          selectedId={selectedConv?.id} 
        />
      </div>

      {/* Main Chat Terminal */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/20 relative">
        <AnimatePresence mode="wait">
          {selectedConv ? (
            <motion.div 
              key={selectedConv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              <ChatHeader 
                title={selectedConv.username} 
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
                onEdit={(msg) => console.log("Edit requested")}
                onDelete={(msgId) => deleteMessage(msgId)}
                loading={loadingMessages}
                isTyping={selectedConv.typing?.user}
              />

              <ChatInput 
                onSend={handleSend}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                typingRef={setTypingStatus}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30">
               <div className="w-20 h-20 rounded-[32px] bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-pulse text-slate-300" />
               </div>
               <div className="text-center">
                  <p className="text-sm font-black uppercase italic tracking-tighter">Central Signal Receiver</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select an identity to initiate relay</p>
               </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
