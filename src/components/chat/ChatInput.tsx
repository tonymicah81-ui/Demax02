import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Plus, X, File as FileIcon, AlertCircle } from "lucide-react";
import { uploadToCloudinary, checkFileCache } from "../../lib/cloudinary";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";
import { Message } from "../../lib/chatService";

interface FileEntry {
  id: string;
  file: File;
  name: string;
  previewUrl?: string;    // data URL for image thumbnails
  progress: number;       // 0–100
  done: boolean;
  error?: string;
  cancelled: boolean;
  controller: AbortController;
  result?: { url: string; name: string; type: string };
}

interface ChatInputProps {
  onSend: (text: string, files?: { url: string; name: string; type: string }[], replyTo?: Message) => void;
  replyTo?: Message | null;
  onCancelReply: () => void;
  typingRef?: (isTyping: boolean) => void;
}

function getFileType(file: File): "image" | "video" | "doc" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "doc";
}

export function ChatInput({ onSend, replyTo, onCancelReply, typingRef }: ChatInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notify parent about typing status
  useEffect(() => {
    typingRef?.(text.length > 0);
  }, [text, typingRef]);

  const allDone = files.every(f => f.done || f.cancelled || !!f.error);
  const hasActiveContent = (text.trim().length > 0 || files.some(f => f.done && f.result)) && allDone;
  const isUploading = files.some(f => !f.done && !f.cancelled && !f.error);

  const startUpload = useCallback(async (entry: FileEntry) => {
    // Check localStorage cache first — avoid re-uploading the same file
    const cached = checkFileCache(entry.file);
    if (cached) {
      setFiles(prev =>
        prev.map(f =>
          f.id === entry.id ? { ...f, progress: 100, done: true, result: cached } : f
        )
      );
      return;
    }

    try {
      const result = await uploadToCloudinary(
        entry.file,
        (percent) => {
          setFiles(prev =>
            prev.map(f => (f.id === entry.id ? { ...f, progress: percent } : f))
          );
        },
        "any",
        entry.controller.signal
      );

      const fileResult = {
        url: result.secure_url,
        name: result.original_filename || entry.file.name,
        type: getFileType(entry.file),
      };

      setFiles(prev =>
        prev.map(f =>
          f.id === entry.id ? { ...f, progress: 100, done: true, result: fileResult } : f
        )
      );
    } catch (err: any) {
      if (err?.name === "AbortError" || entry.controller.signal.aborted) {
        setFiles(prev =>
          prev.map(f => (f.id === entry.id ? { ...f, cancelled: true, done: true } : f))
        );
      } else {
        setFiles(prev =>
          prev.map(f =>
            f.id === entry.id
              ? { ...f, done: true, error: "Upload failed" }
              : f
          )
        );
      }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    if (selected.length === 0) return;

    const newEntries: FileEntry[] = selected.map(file => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const controller = new AbortController();

      // Generate image preview
      let previewUrl: string | undefined;
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
      }

      return {
        id,
        file,
        name: file.name,
        previewUrl,
        progress: 0,
        done: false,
        cancelled: false,
        controller,
      };
    });

    setFiles(prev => [...prev, ...newEntries]);

    // Start uploads
    for (const entry of newEntries) {
      startUpload(entry);
    }
  };

  const cancelFile = (id: string) => {
    setFiles(prev => {
      const entry = prev.find(f => f.id === id);
      if (entry && !entry.done) entry.controller.abort();
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSend = () => {
    if (!hasActiveContent || isUploading) return;

    const completedFiles = files
      .filter(f => f.done && !f.cancelled && !f.error && f.result)
      .map(f => f.result!);

    onSend(text, completedFiles.length > 0 ? completedFiles : undefined, replyTo || undefined);
    setText("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const adjustHeight = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  return (
    <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-brand-border dark:border-white/5">
      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-4 mt-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-brand-accent flex items-center justify-between"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-0.5">Replying to</p>
              <p className="text-xs text-slate-500 truncate">{replyTo.text || "File Attachment"}</p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all ml-2 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File strip */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 overflow-x-auto pb-1 px-4 pt-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {files.map(entry => (
                <FilePreviewChip key={entry.id} entry={entry} onCancel={() => cancelFile(entry.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-11 h-11 flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text input */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl px-1 flex items-end min-h-[44px]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onInput={adjustHeight}
            placeholder="Type a message..."
            className="w-full bg-transparent border-none focus:outline-none px-3 py-3 text-sm font-medium resize-none dark:text-white placeholder:text-slate-400 max-h-[140px]"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!hasActiveContent || isUploading}
          className={cn(
            "w-11 h-11 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-sm",
            hasActiveContent && !isUploading
              ? "bg-brand-accent text-white shadow-brand-accent/20 hover:bg-brand-accent/90 hover:scale-105"
              : "bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── File preview chip with progress bar ────────────────────────────────────
function FilePreviewChip({ entry, onCancel }: { entry: FileEntry; onCancel: () => void }) {
  const isImage = entry.previewUrl != null;
  const hasError = !!entry.error;

  return (
    <div className="relative flex-shrink-0 w-20 group">
      {/* Thumbnail / icon */}
      <div
        className={cn(
          "w-20 h-20 rounded-2xl overflow-hidden border flex items-center justify-center",
          hasError
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
            : "bg-slate-100 dark:bg-slate-800 border-brand-border dark:border-white/5"
        )}
      >
        {isImage ? (
          <img src={entry.previewUrl} alt={entry.name} className="w-full h-full object-cover" />
        ) : hasError ? (
          <AlertCircle className="w-7 h-7 text-red-400" />
        ) : (
          <FileIcon className="w-7 h-7 text-slate-400" />
        )}

        {/* Upload progress overlay */}
        {!entry.done && !hasError && (
          <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-white font-black text-sm">{entry.progress}%</span>
            {/* Circular progress indicator */}
            <div className="mt-1 w-8 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${entry.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Done checkmark overlay */}
        {entry.done && !hasError && !entry.cancelled && isImage && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-2xl" />
        )}
      </div>

      {/* Filename */}
      <p className={cn(
        "text-[8px] font-bold uppercase tracking-wider mt-1 truncate text-center leading-tight",
        hasError ? "text-red-400" : "text-slate-400"
      )}>
        {hasError ? "Failed" : entry.name}
      </p>

      {/* Progress bar (below chip) */}
      {!entry.done && !hasError && (
        <div className="mt-0.5 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-accent rounded-full"
            animate={{ width: `${entry.progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}

      {/* Cancel / remove button */}
      <button
        onClick={onCancel}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-700 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
