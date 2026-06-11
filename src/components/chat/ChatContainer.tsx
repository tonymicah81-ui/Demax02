import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatDateSeparator } from "./ChatHeader";
import { format, isSameDay } from "date-fns";
import { Message } from "../../lib/chatService";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

interface ChatContainerProps {
  messages: Message[];
  currentUserId: string;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  isAdminView: boolean;
  loading?: boolean;
  isTyping?: boolean;
}

export function ChatContainer({ 
  messages, 
  currentUserId, 
  onReply, 
  onEdit, 
  onDelete, 
  isAdminView,
  loading,
  isTyping
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-4", "ring-brand-accent/50", "ring-offset-2");
      setTimeout(() => el.classList.remove("ring-4", "ring-brand-accent/50", "ring-offset-2"), 2000);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full opacity-50">
           <Loader2 className="w-8 h-8 animate-spin text-brand-accent mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">Accessing Signal Relays...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, i) => {
            const prevMsg = messages[i - 1];
            const msgDate = new Date(msg.createdAt?.seconds * 1000 || Date.now());
            const showDate = !prevMsg || !isSameDay(msgDate, new Date(prevMsg.createdAt?.seconds * 1000));

            return (
              <div key={msg.id} id={`msg-${msg.id}`}>
                {showDate && <ChatDateSeparator date={msgDate} />}
                <MessageBubble 
                  message={msg}
                  isMe={msg.senderId === currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isAdminView={isAdminView}
                  replyToMessage={messages.find(m => m.id === msg.replyTo)}
                  onClickReply={scrollToMessage}
                />
              </div>
            );
          })}

          {isTyping && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center gap-2 mb-8 ml-2"
            >
               <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-brand-accent"
                    />
                  ))}
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Receiving Pulse...</span>
            </motion.div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
