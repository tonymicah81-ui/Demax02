'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { logAction } from '@/lib/auditService';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminProfile } from '@/types';

export default function AdminsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);

  async function load() {
    const snap = await getDocs(collection(db, 'admins'));
    setAdmins(snap.docs.map(d => ({ ...d.data(), uid: d.id } as AdminProfile)));
  }

  useEffect(() => { load(); }, []);

  async function promote(a: AdminProfile) {
    const next = a.role === 'admin' ? 'super_admin' : 'admin';
    await updateDoc(doc(db, 'admins', a.uid), { role: next });
    await logAction({ actorId: user!.uid, actorEmail: user!.email!, actorRole: user!.role, action: 'promote_admin', targetId: a.uid, details: `${a.role} → ${next}` });
    toast(`Role updated to ${next}`, 'success');
    load();
  }

  async function toggleStatus(a: AdminProfile) {
    const next = a.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'admins', a.uid), { status: next });
    toast(`Admin ${next}`, 'success');
    load();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-black text-white mb-6">Admin Staff ({admins.length})</h1>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr className="text-left text-xs text-gray-500 uppercase tracking-widest">
              {['Email', 'Role', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {admins.map(a => (
              <tr key={a.uid} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white text-xs font-medium">{a.email}</td>
                <td className="px-4 py-3"><Badge label={a.role.replace('_', ' ')} variant={a.role === 'super_admin' ? 'warning' : 'info'} /></td>
                <td className="px-4 py-3"><Badge label={a.status} variant={a.status === 'active' ? 'success' : 'default'} dot /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => promote(a)}>
                      {a.role === 'admin' ? '→ Super Admin' : '→ Admin'}
                    </Button>
                    <Button size="sm" variant={a.status === 'active' ? 'danger' : 'secondary'} onClick={() => toggleStatus(a)}>
                      {a.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
