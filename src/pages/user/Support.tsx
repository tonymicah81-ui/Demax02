import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../AuthContext";
import { db, collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "../../firebase";
import { Conversation, Message, sendMessage } from "../../lib/chatService";
import { ChatContainer } from "../../components/chat/ChatContainer";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatInput } from "../../components/chat/ChatInput";

export default function Support() {
  const { user, profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const conversationIdRef = useRef("");

  // Watch the user's conversation node
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "conversations"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const convData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Conversation;
        setConversation(convData);
        conversationIdRef.current = convData.id;
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Watch messages for this conversation
  useEffect(() => {
    if (!conversation?.id) return;

    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversation.id),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]);
    });

    return () => unsub();
  }, [conversation?.id]);

  const handleSend = async (
    text: string,
    files?: { url: string; name: string; type: string }[],
    replyingMsg?: Message
  ) => {
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

  const handleTyping = async (isTyping: boolean) => {
    if (!conversationIdRef.current) return;
    try {
      await updateDoc(doc(db, "conversations", conversationIdRef.current), {
        "typing.user": isTyping,
      });
    } catch {
      // Ignore — conversation may not exist yet (first message not sent)
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
      <div>
        <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">
          Support Chat
        </h1>
        <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
          Direct line to the Durex Team // Encrypted
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-[40px] border border-brand-border dark:border-white/5 shadow-2xl overflow-hidden">
        <ChatHeader
          title="Durex Team Support"
          status="online"
          isTyping={conversation?.typing?.admin}
          isAdminView={false}
        />

        <ChatContainer
          messages={messages}
          currentUserId={user?.uid || ""}
          isAdminView={false}
          onReply={(msg) => setReplyTo(msg)}
          onDelete={() => {}}
          loading={loading && messages.length === 0}
          isTyping={conversation?.typing?.admin}
        />

        <ChatInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          typingRef={handleTyping}
        />
      </div>
    </div>
  );
}
