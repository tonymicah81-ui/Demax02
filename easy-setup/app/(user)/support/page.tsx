'use client';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { subscribeToUserThread, createThread } from '@/lib/chatService';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { ChatThread } from '@/types';

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeToUserThread(user.uid, setThread);
  }, [user]);

  async function handleCreate() {
    if (!subject.trim() || !user) return;
    setCreating(true);
    try {
      const username = user.profile && 'username' in user.profile ? user.profile.username : 'User';
      await createThread(user.uid, username, subject.trim());
      setShowNew(false);
      setSubject('');
    } catch {
      toast('Failed to create conversation', 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="h-screen flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black dark:text-white">Support Chat</h1>
        {!thread && (
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-1" />New conversation
          </Button>
        )}
      </div>

      {thread ? (
        <div className="flex-1 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
          <ChatWindow thread={thread} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="font-bold dark:text-white mb-1">No active conversation</p>
          <p className="text-sm text-gray-400 mb-4">Start a new conversation to get support.</p>
          <Button onClick={() => setShowNew(true)}>Start conversation</Button>
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Support Conversation">
        <div className="space-y-4">
          <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="What do you need help with?" />
          <Button onClick={handleCreate} loading={creating} className="w-full">Start conversation</Button>
        </div>
      </Modal>
    </div>
  );
}
