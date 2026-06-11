import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../AuthContext";
import { db, collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "../../firebase";
import { Conversation, Message, sendMessage, editMessage, deleteMessage } from "../../lib/chatService";
import { ChatContainer } from "../../components/chat/ChatContainer";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatInput } from "../../components/chat/ChatInput";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Shield } from "lucide-react";

export default function Support() {
  const { user, profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  
  const conversationIdRef = useRef("");

  useEffect(() => {
    if (!user) return;

    // Listen for the user's conversation node
    const q = query(collection(db, "conversations"), where("userId", "==", user.uid));
    const unsubscribeConv = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const convData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Conversation;
        setConversation(convData);
        conversationIdRef.current = convData.id;
        
        // Mark as read when user looks at it
        updateDoc(doc(db, "conversations", convData.id), { "typing.user": false });
      }
      setLoading(false);
    });

    return () => unsubscribeConv();
  }, [user]);

  useEffect(() => {
    if (!conversation?.id) return;

    const q = query(
      collection(db, "messages"), 
      where("conversationId", "==", conversation.id),
      orderBy("createdAt", "asc")
    );

    const unsubscribeMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]);
    });

    return () => unsubscribeMessages();
  }, [conversation?.id]);

  const handleSend = async (text: string, files?: any[], replyingMsg?: any) => {
    if (!user || !profile) return;
    
    const messagePayload: Partial<Message> = {
      text,
      senderId: user.uid,
      senderRole: "user",
      replyTo: replyingMsg?.id || "",
    };

    if (files && files.length > 0) {
       messagePayload.file = files[0];
    }

    await sendMessage(
      conversation?.id || "", 
      messagePayload, 
      user.uid, 
      profile.email || "", 
      profile.username
    );
    setReplyTo(null);
  };

  const setTypingStatus = async (isTyping: boolean) => {
    if (!conversationIdRef.current) return;
    await updateDoc(doc(db, "conversations", conversationIdRef.current), {
      "typing.user": isTyping
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-8">
      <div>
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">System_Relay</h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
          Secure Tunnel // Secure Signal Environment
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-[40px] border border-brand-border dark:border-white/5 shadow-2xl overflow-hidden relative">
         <ChatHeader 
            title="Durex Team Support" 
            status="online" 
            isTyping={conversation?.typing?.admin}
         />

         <ChatContainer 
            messages={messages}
            currentUserId={user?.uid || ""}
            isAdminView={false}
            onReply={(msg) => setReplyTo(msg)}
            onEdit={() => {}} // Users can't edit
            onDelete={() => {}} // Users can't delete
            loading={loading && messages.length === 0}
            isTyping={conversation?.typing?.admin}
         />

         <ChatInput 
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            typingRef={setTypingStatus}
         />
      </div>
    </div>
  );
}
