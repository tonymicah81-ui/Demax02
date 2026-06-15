'use client';
import { useState } from 'react';
import { Pencil, Trash2, Check, X, Download } from 'lucide-react';
import { editMessage, deleteMessageForUser } from '@/lib/chatService';
import type { ChatMessage } from '@/types';
import { clsx } from 'clsx';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isAdmin?: boolean;
}

export function MessageBubble({ message, isMine, isAdmin }: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  if (message.deletedForUser && !isAdmin) {
    return <p className="text-xs text-gray-400 italic text-center py-1">This message was removed.</p>;
  }

  async function saveEdit() {
    if (!editText.trim()) return;
    await editMessage(message.threadId, message.id, editText.trim());
    setEditing(false);
  }

  return (
    <div className={clsx('flex group', isMine ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-xs lg:max-w-md', isMine ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
        {!isMine && <p className="text-[10px] text-gray-400 ml-1">{message.senderName}</p>}
        <div className={clsx('rounded-2xl px-4 py-2.5 text-sm',
          isMine ? 'bg-[var(--color-primary)] text-white rounded-br-sm' : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white rounded-bl-sm')}>
          {editing ? (
            <div className="flex items-center gap-2 min-w-[160px]">
              <input value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                className="flex-1 bg-transparent border-b border-white/40 outline-none text-sm py-0.5" />
              <button onClick={saveEdit}><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <>
              {message.fileUrl ? (
                <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 underline opacity-90 text-xs">
                  <Download className="w-3.5 h-3.5" />{message.fileName || 'Attachment'}
                </a>
              ) : (
                <p className="leading-relaxed">{message.content}</p>
              )}
              {message.edited && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}
            </>
          )}
        </div>
        {/* Actions on hover */}
        {isMine && !editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Pencil className="w-3 h-3" />
            </button>
            {isAdmin && (
              <button onClick={() => deleteMessageForUser(message.threadId, message.id)} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
