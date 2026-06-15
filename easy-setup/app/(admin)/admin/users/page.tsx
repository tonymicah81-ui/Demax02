'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { logAction } from '@/lib/auditService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { UserProfile } from '@/types';
import Link from 'next/link';

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
    setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)));
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleStatus(u: UserProfile) {
    const next = u.status === 'active' ? 'suspended' : 'active';
    await updateDoc(doc(db, 'users', u.uid), { status: next });
    await logAction({ actorId: user!.uid, actorEmail: user!.email!, actorRole: user!.role, action: `user_${next}`, targetId: u.uid, targetType: 'user' });
    toast(`User ${next}`, 'success');
    loadUsers();
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-black dark:text-white mb-6">Users ({users.length})</h1>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 dark:border-white/10">
            <tr className="text-left text-xs text-gray-400 uppercase tracking-widest">
              {['User', 'Email', 'Phone', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.uid}`} className="font-semibold dark:text-white hover:text-[var(--color-primary)]">{u.username}</Link>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.phoneNumber}</td>
                <td className="px-4 py-3">
                  <Badge label={u.status} variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'warning' : 'error'} dot />
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant={u.status === 'active' ? 'danger' : 'secondary'} onClick={() => toggleStatus(u)}>
                    {u.status === 'active' ? 'Suspend' : 'Restore'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
