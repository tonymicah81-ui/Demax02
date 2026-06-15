import { collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { AuditLog, UserRole } from '@/types';

export async function logAction(params: {
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...params,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking — never let audit failures break app flow
  }
}

export async function getAuditLogs(options?: {
  actorId?: string;
  action?: string;
  limitCount?: number;
}): Promise<AuditLog[]> {
  let q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(options?.limitCount || 100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
}
