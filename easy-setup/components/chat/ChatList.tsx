'use client';
import { clsx } from 'clsx';
import type { ChatThread } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface ChatListProps {
  threads: ChatThread[];
  selectedId?: string;
  onSelect: (thread: ChatThread) => void;
  isAdmin?: boolean;
}

export function ChatList({ threads, selectedId, onSelect, isAdmin }: ChatListProps) {
  if (threads.length === 0) {
    return <div className="p-6 text-center text-sm text-gray-400">No conversations yet.</div>;
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-white/5">
      {threads.map(t => (
        <button key={t.id} onClick={() => onSelect(t)}
          className={clsx('w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors',
            selectedId === t.id && 'bg-gray-50 dark:bg-white/5')}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold dark:text-white truncate">{isAdmin ? t.username : t.subject}</p>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {(isAdmin ? t.unreadAdmin : t.unreadUser) > 0 && (
                <span className="w-4 h-4 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {isAdmin ? t.unreadAdmin : t.unreadUser}
                </span>
              )}
              <Badge label={t.status} variant={t.status === 'open' ? 'success' : t.status === 'pending' ? 'warning' : 'default'} />
            </div>
          </div>
          <p className="text-xs text-gray-400 truncate">{isAdmin ? t.subject : t.lastMessage || 'No messages yet'}</p>
        </button>
      ))}
    </div>
  );
}
