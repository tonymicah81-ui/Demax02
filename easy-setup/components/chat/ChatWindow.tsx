'use client';
import { useEffect, useRef, useState } from 'react';
import { subscribeToMessages, sendMessage, markThreadRead } from '@/lib/chatService';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, ChatThread } from '@/types';

interface ChatWindowProps {
  thread: ChatThread;
  isAdmin?: boolean;
}

export function ChatWindow({ thread, isAdmin }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToMessages(thread.id, setMessages);
    markThreadRead(thread.id, isAdmin ? 'admin' : 'user');
    return unsub;
  }, [thread.id, isAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(content: string, file?: { url: string; type: string; name: string }) {
    if (!user) return;
    await sendMessage(
      thread.id, user.uid,
      user.profile && 'username' in user.profile ? user.profile.username : 'Admin',
      isAdmin ? 'admin' : 'user',
      content, file
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10">
        <p className="text-sm font-semibold dark:text-white">{thread.subject}</p>
        <p className="text-xs text-gray-400">{isAdmin ? `User: ${thread.username}` : 'Support Team'}</p>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.filter(m => isAdmin || !m.deletedForUser).map(m => (
          <MessageBubble key={m.id} message={m} isMine={m.senderId === user?.uid} isAdmin={isAdmin} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={thread.status === 'closed'} />
      {thread.status === 'closed' && (
        <p className="text-center text-xs text-gray-400 py-2 border-t border-gray-100 dark:border-white/10">This conversation is closed.</p>
      )}
    </div>
  );
}
