import { collection, addDoc, updateDoc, doc, query, orderBy, onSnapshot, where, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { Notification } from '@/types';

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db, 'user_notifications', userId, 'items'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
  });
}

export async function sendNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: Notification['type'];
  link?: string;
}): Promise<void> {
  await addDoc(collection(db, 'user_notifications', params.userId, 'items'), {
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type || 'info',
    link: params.link || '',
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'user_notifications', userId, 'items', notificationId), { read: true });
}

export async function markAllRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'user_notifications', userId, 'items'),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}
