'use client';
import { useEffect, useState } from 'react';
import { subscribeToAllThreads } from '@/lib/chatService';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import type { ChatThread } from '@/types';

export default function AdminChatsPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selected, setSelected] = useState<ChatThread | null>(null);

  useEffect(() => subscribeToAllThreads(setThreads), []);

  return (
    <div className="h-screen flex">
      {/* Thread list */}
      <div className="w-72 border-r border-gray-100 dark:border-white/10 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="font-black text-sm dark:text-white">Support Chats</h2>
          <p className="text-xs text-gray-400 mt-0.5">{threads.filter(t => t.status === 'open').length} open</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatList threads={threads} selectedId={selected?.id} onSelect={setSelected} isAdmin />
        </div>
      </div>
      {/* Chat window */}
      <div className="flex-1">
        {selected ? (
          <ChatWindow thread={selected} isAdmin />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
