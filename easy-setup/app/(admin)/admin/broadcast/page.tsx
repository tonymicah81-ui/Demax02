'use client';
import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendNotification } from '@/lib/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { logAction } from '@/lib/auditService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Megaphone } from 'lucide-react';

export default function BroadcastPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !user) return;
    setSending(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const uids = snap.docs.map(d => d.id);
      await Promise.all(uids.map(uid => sendNotification({ userId: uid, title: title.trim(), message: message.trim(), type: 'info' })));
      await logAction({ actorId: user.uid, actorEmail: user.email!, actorRole: user.role, action: 'broadcast', details: `Sent to ${uids.length} users: ${title}` });
      setSent(uids.length);
      setTitle('');
      setMessage('');
      toast(`Broadcast sent to ${uids.length} users`, 'success');
    } catch {
      toast('Failed to send broadcast', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black dark:text-white">Broadcast</h1>
          <p className="text-xs text-gray-400">Send a notification to all users</p>
        </div>
      </div>
      <form onSubmit={handleBroadcast} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-white/10 space-y-4">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" required />
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
            placeholder="Write your message here..."
            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] dark:text-white placeholder:text-gray-400 resize-none" />
        </div>
        <Button type="submit" loading={sending} className="w-full">Send to all users</Button>
      </form>
      {sent > 0 && <p className="text-center text-sm text-green-500 mt-3">✓ Last broadcast reached {sent} users</p>}
    </div>
  );
}
