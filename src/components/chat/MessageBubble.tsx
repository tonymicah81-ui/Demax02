import { useState, useRef, useEffect } from "react";
import { MoreVertical, Copy, Reply, Edit3, Trash2, CheckCircle2, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { cn } from "../../utils/cn";
import { Message } from "../../lib/chatService";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  isAdminView: boolean;
  replyToMessage?: Message;
  onClickReply?: (msgId: string) => void;
}

export function MessageBubble({ 
  message, 
  isMe, 
  onReply, 
  onEdit, 
  onDelete, 
  isAdminView, 
  replyToMessage,
  onClickReply
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setShowMenu(false);
  };

  // User constraints: 
  // - Users only see copy and reply for all messages.
  // - Admin sees copy and reply for user messages.
  // - Admin sees copy, reply, edit, delete for their OWN messages.
  const canModify = isAdminView && isMe && !message.deleted;

  return (
    <div className={cn(
      "flex flex-col mb-6 group",
      isMe ? "items-end" : "items-start"
    )}>
      {replyToMessage && (
        <div 
          onClick={() => onClickReply?.(replyToMessage.id)}
          className={cn(
            "mb-1 p-2 bg-slate-100/50 dark:bg-slate-800/50 border-l-2 border-brand-accent rounded-lg text-[10px] text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors max-w-[200px] truncate",
            isMe ? "mr-2" : "ml-2"
          )}
        >
          <p className="font-black opacity-50 uppercase tracking-widest text-[8px] mb-0.5">Reference Signal</p>
          {replyToMessage.text || "Media Payload"}
        </div>
      )}

      <div className={cn(
        "flex items-end gap-2",
        isMe ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "relative max-w-[300px] md:max-w-[450px] p-4 rounded-3xl text-sm font-medium shadow-sm transition-all",
          isMe 
            ? "bg-brand-accent text-white rounded-tr-none hover:shadow-brand-accent/20" 
            : "bg-white dark:bg-slate-800 text-brand-text-bold dark:text-slate-100 border border-brand-border dark:border-white/5 rounded-tl-none hover:border-brand-accent/30"
        )}>
          {message.file && (
             <div className="mb-3 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 bg-black/5">
                {message.file.type === 'image' ? (
                  <img src={message.file.url} alt="Payload" className="w-full h-auto cursor-pointer" referrerPolicy="no-referrer" onClick={() => window.open(message.file?.url)} />
                ) : message.file.type === 'video' ? (
                  <video src={message.file.url} controls className="w-full h-auto" />
                ) : (
                   <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{message.file.name}</p>
                        <p className="text-[10px] opacity-60 uppercase tracking-widest">Protocol Document</p>
                      </div>
                      <a href={message.file.url} target="_blank" rel="noreferrer" className="p-2 ml-auto hover:bg-white/10 rounded-lg"><ChevronDown className="w-4 h-4" /></a>
                   </div>
                )}
             </div>
          )}
          
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.deleted ? <span className="italic opacity-50 font-mono text-xs italic italic">REDACTED_BY_SUPPORT</span> : message.text}
          </div>

          {!message.deleted && (
            <div className="absolute top-2 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-8 h-8 rounded-full bg-white border border-brand-border flex items-center justify-center text-black hover:bg-slate-50 shadow-xl translate-x-1/2"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={cn(
                           "absolute bottom-full mb-2 right-0 bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-2xl p-2 shadow-2xl z-50 min-w-[120px]",
                           isMe ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"
                        )}
                      >
                         <button onClick={handleCopy} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-accent transition-all">
                           <Copy className="w-3.5 h-3.5" /> COPY
                         </button>
                         <button onClick={() => { onReply(message); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-accent transition-all">
                           <Reply className="w-3.5 h-3.5" /> REPLY
                         </button>
                         
                         {canModify && (
                           <>
                             <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                             <button onClick={() => { onEdit(message); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all">
                               <Edit3 className="w-3.5 h-3.5" /> EDIT
                             </button>
                             <button onClick={() => { onDelete(message.id); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                               <Trash2 className="w-3.5 h-3.5" /> DELETE
                             </button>
                           </>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        "flex items-center gap-2 mt-1.5 px-1",
        isMe ? "justify-end" : "justify-start"
      )}>
        {message.edited && !message.deleted && <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">MODIFIED</span>}
        <span className="text-[9px] font-mono font-bold text-slate-400 italic">
          {message.createdAt ? format(new Date(message.createdAt.seconds * 1000), 'HH:mm') : '--:--'}
        </span>
      </div>
    </div>
  );
}
