import { useState, useRef, useEffect } from "react";
import { Send, Plus, X, File, Paperclip, ChevronDown, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";

interface ChatInputProps {
  onSend: (text: string, files?: any[], replyTo?: any) => void;
  replyTo?: any;
  onCancelReply: () => void;
  typingRef?: (isTyping: boolean) => void;
}

export function ChatInput({ onSend, replyTo, onCancelReply, typingRef }: ChatInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typingRef) {
      typingRef(text.length > 0);
    }
  }, [text, typingRef]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    for (const file of selectedFiles) {
      try {
        const res = await uploadToCloudinary(file);
        uploadedFiles.push({
          url: res.secure_url,
          name: res.original_filename,
          type: res.resource_type === 'image' ? 'image' : (res.resource_type === 'video' ? 'video' : 'doc')
        });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    setFiles(prev => [...prev, ...uploadedFiles]);
    setUploading(false);
  };

  const handleSend = () => {
    if ((!text.trim() && files.length === 0) || uploading) return;
    onSend(text, files, replyTo);
    setText("");
    setFiles([]);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const adjustHeight = (e: any) => {
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-brand-border dark:border-white/5 sticky bottom-0 z-10">
      <AnimatePresence>
        {replyTo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-l-4 border-brand-accent flex items-center justify-between"
          >
            <div className="min-w-0">
               <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-1">Replying to Action</p>
               <p className="text-xs text-slate-500 truncate">{replyTo.text || "Media Attachment"}</p>
            </div>
            <button onClick={onCancelReply} className="p-1 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        {files.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
            {files.map((file, i) => (
              <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 flex items-center justify-center overflow-hidden group">
                {file.type === 'image' ? (
                  <img src={file.url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <File className="w-6 h-6 text-slate-400" />
                )}
                <button 
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {uploading && (
               <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-brand-accent flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
               </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-3">
           <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-brand-accent hover:text-white transition-all shadow-sm"
           >
             <Plus className="w-6 h-6" />
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             multiple 
             className="hidden" 
             onChange={handleFileChange}
           />

           <div className="flex-1 bg-slate-100 dark:bg-slate-800 border border-brand-border dark:border-white/5 rounded-2xl p-1 flex items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onInput={adjustHeight}
                placeholder="EXECUTE_MESSAGE_COMMAND..."
                className="w-full bg-transparent border-none focus:outline-none p-3 text-sm font-medium resize-none overflow-hidden max-h-[150px] dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
           </div>

           <button 
            disabled={(!text.trim() && files.length === 0) || uploading}
            onClick={handleSend}
            className={cn(
              "w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-lg",
              ((text.trim() || files.length > 0) && !uploading)
                ? "bg-brand-accent text-white shadow-brand-accent/20" 
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed"
            )}
           >
             {uploading ? <Check className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
           </button>
        </div>
      </div>
    </div>
  );
}
