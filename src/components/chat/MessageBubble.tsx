import { useState, useRef, useEffect } from "react";
import { MoreVertical, Copy, Reply, Edit3, Trash2, ChevronDown, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { cn } from "../../utils/cn";
import { Message, editMessage } from "../../lib/chatService";
import { FileViewer } from "./FileViewer";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onReply: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  isAdminView: boolean;
  replyToMessage?: Message;
  onClickReply?: (msgId: string) => void;
}

export function MessageBubble({
  message,
  isMe,
  onReply,
  onDelete,
  isAdminView,
  replyToMessage,
  onClickReply,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [viewingFile, setViewingFile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [savingEdit, setSavingEdit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  // Auto-focus edit textarea
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setShowMenu(false);
  };

  const handleStartEdit = () => {
    setEditText(message.text);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false);
      return;
    }
    setSavingEdit(true);
    try {
      await editMessage(message.id, editText.trim());
      setIsEditing(false);
    } catch {
      // Keep editing mode open on failure
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  // Admin can edit/delete their own non-deleted messages
  const canModify = isAdminView && isMe && !message.deleted;

  // For USER view: admin's deleted messages are completely hidden
  // (users should never know an admin message was deleted or edited)
  if (!isAdminView && message.deleted && message.senderRole === "admin") {
    return null;
  }

  const getTimestamp = () => {
    if (!message.createdAt) return "--:--";
    const seconds = message.createdAt.seconds;
    return format(new Date(seconds * 1000), "HH:mm");
  };

  return (
    <>
      <div
        id={`msg-${message.id}`}
        className={cn("flex flex-col mb-4 group transition-all duration-300", isMe ? "items-end" : "items-start")}
      >
        {/* Reply reference */}
        {replyToMessage && (
          <div
            onClick={() => onClickReply?.(replyToMessage.id)}
            className={cn(
              "mb-1.5 px-3 py-2 bg-slate-100/70 dark:bg-slate-800/70 border-l-2 border-brand-accent rounded-xl text-[10px] text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors max-w-[260px]",
              isMe ? "mr-1" : "ml-1"
            )}
          >
            <p className="font-black text-brand-accent uppercase tracking-widest text-[8px] mb-0.5">Replying to</p>
            <p className="truncate">{replyToMessage.text || "File Attachment"}</p>
          </div>
        )}

        <div className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
          {/* Bubble */}
          <div
            className={cn(
              "relative max-w-[300px] md:max-w-[460px] rounded-3xl text-sm font-medium shadow-sm transition-all",
              isMe
                ? "bg-brand-accent text-white rounded-tr-sm"
                : "bg-white dark:bg-slate-800 text-brand-text-bold dark:text-slate-100 border border-brand-border dark:border-white/5 rounded-tl-sm"
            )}
          >
            {/* File attachment */}
            {message.file && !message.deleted && (
              <div
                className="overflow-hidden rounded-t-3xl cursor-pointer"
                onClick={() => setViewingFile(true)}
              >
                {message.file.type === "image" ? (
                  <img
                    src={message.file.url}
                    alt={message.file.name}
                    className="w-full max-h-56 object-cover hover:opacity-90 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                ) : message.file.type === "video" ? (
                  <video
                    src={message.file.url}
                    className="w-full max-h-56 object-cover"
                    onClick={e => { e.stopPropagation(); setViewingFile(true); }}
                  />
                ) : (
                  <div
                    className={cn(
                      "px-4 pt-4 pb-2 flex items-center gap-3",
                      isMe ? "border-b border-white/20" : "border-b border-brand-border dark:border-white/10"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", isMe ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700")}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{message.file.name}</p>
                      <p className={cn("text-[10px] uppercase tracking-widest", isMe ? "opacity-60" : "text-slate-400")}>Document</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message text or edit mode */}
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    ref={editRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    rows={3}
                    className="w-full bg-white/10 dark:bg-black/10 border border-white/30 rounded-xl px-3 py-2 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/40"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit || !editText.trim()}
                      className="px-3 py-1.5 bg-white/30 hover:bg-white/40 disabled:opacity-50 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                    >
                      {savingEdit ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.deleted
                    ? (isAdminView
                        ? <span className="italic opacity-50 text-xs">Message deleted</span>
                        : null // user view: hidden entirely (filtered above for admin messages; for user's own deleted — should not happen)
                      )
                    : message.text}
                </div>
              )}
            </div>

            {/* Three-dot menu button — only when not editing */}
            {!message.deleted && !isEditing && (
              <div
                className={cn(
                  "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  isMe ? "-left-4" : "-right-4"
                )}
              >
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(v => !v)}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 6 }}
                        className={cn(
                          "absolute bottom-full mb-2 bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[130px]",
                          isMe ? "left-0 -translate-x-[calc(100%-32px)]" : "left-0"
                        )}
                      >
                        <MenuButton icon={<Copy className="w-3.5 h-3.5" />} label="Copy" onClick={handleCopy} />
                        <MenuButton icon={<Reply className="w-3.5 h-3.5" />} label="Reply" onClick={() => { onReply(message); setShowMenu(false); }} />

                        {canModify && (
                          <>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                            <MenuButton icon={<Edit3 className="w-3.5 h-3.5" />} label="Edit" onClick={handleStartEdit} color="amber" />
                            <MenuButton icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" onClick={() => { onDelete(message.id); setShowMenu(false); }} color="red" />
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

        {/* Timestamp + edited indicator */}
        <div className={cn("flex items-center gap-1.5 mt-1 px-1", isMe ? "justify-end" : "justify-start")}>
          {/* Only show "edited" to admin view — users never see this */}
          {isAdminView && message.edited && !message.deleted && (
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">edited</span>
          )}
          <span className="text-[9px] font-mono text-slate-400">{getTimestamp()}</span>
        </div>
      </div>

      {/* File lightbox viewer */}
      {viewingFile && message.file && (
        <FileViewer file={message.file} onClose={() => setViewingFile(false)} />
      )}
    </>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  color = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: "default" | "amber" | "red";
}) {
  const colorClass = {
    default: "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-accent",
    amber: "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10",
    red: "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10",
  }[color];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
        colorClass
      )}
    >
      {icon}
      {label}
    </button>
  );
}
