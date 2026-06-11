import { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatDateSeparator } from "./ChatHeader";
import { isSameDay } from "date-fns";
import { Message } from "../../lib/chatService";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, MessageSquare } from "lucide-react";

interface ChatContainerProps {
  messages: Message[];
  currentUserId?: string;
  onReply: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  isAdminView: boolean;
  loading?: boolean;
  isTyping?: boolean;
}

export function ChatContainer({
  messages,
  currentUserId,
  onReply,
  onDelete,
  isAdminView,
  loading,
  isTyping,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing indicator
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-brand-accent/40", "ring-offset-2", "rounded-3xl");
      setTimeout(
        () => el.classList.remove("ring-2", "ring-brand-accent/40", "ring-offset-2", "rounded-3xl"),
        2000
      );
    }
  };

  const getTimestampMs = (msg: Message) => {
    if (!msg.createdAt) return Date.now();
    return msg.createdAt.seconds ? msg.createdAt.seconds * 1000 : Date.now();
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
          <Loader2 className="w-7 h-7 animate-spin text-brand-accent" />
          <p className="text-[10px] font-black uppercase tracking-widest">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-25">
          <MessageSquare className="w-12 h-12" />
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-tight">No messages yet</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Send the first message to start the conversation
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, i) => {
            const prevMsg = messages[i - 1];
            const msgDate = new Date(getTimestampMs(msg));
            const showDate = !prevMsg || !isSameDay(msgDate, new Date(getTimestampMs(prevMsg)));

            return (
              <div key={msg.id}>
                {showDate && <ChatDateSeparator date={msgDate} />}
                <MessageBubble
                  message={msg}
                  isMe={msg.senderId === currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                  isAdminView={isAdminView}
                  replyToMessage={messages.find(m => m.id === msg.replyTo)}
                  onClickReply={scrollToMessage}
                />
              </div>
            );
          })}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 mb-4 ml-1"
              >
                <div className="flex gap-1 bg-white dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 rounded-full bg-brand-accent"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">typing...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-2" />
        </div>
      )}
    </div>
  );
}
