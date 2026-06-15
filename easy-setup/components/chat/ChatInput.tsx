'use client';
import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryService';
import { useToast } from '@/contexts/ToastContext';

interface ChatInputProps {
  onSend: (content: string, file?: { url: string; type: string; name: string }) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleSend() {
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      let fileData: { url: string; type: string; name: string } | undefined;
      if (file) {
        setUploading(true);
        const res = await uploadToCloudinary(file);
        fileData = { url: res.url, type: file.type, name: file.name };
        setUploading(false);
      }
      await onSend(text.trim(), fileData);
      setText('');
      setFile(null);
    } catch {
      toast('Failed to send message', 'error');
    } finally {
      setSending(false);
      setUploading(false);
    }
  }

  return (
    <div className="p-4 border-t border-gray-100 dark:border-white/10 space-y-2">
      {file && (
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
          <Paperclip className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{file.name}</span>
          <button onClick={() => setFile(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={() => fileRef.current?.click()} disabled={disabled}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          disabled={disabled || sending}
          className="flex-1 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[var(--color-primary)] dark:text-white placeholder:text-gray-400"
        />
        <button onClick={handleSend} disabled={disabled || sending || uploading || (!text.trim() && !file)}
          className="p-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
