import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, where, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ChatThread, ChatMessage } from '@/types';

// ─── Threads ─────────────────────────────────────────────────────────────────

export function subscribeToUserThread(
  userId: string,
  callback: (thread: ChatThread | null) => void
) {
  const q = query(collection(db, 'chats'), where('userId', '==', userId));
  return onSnapshot(q, snap => {
    const threads = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatThread));
    const open = threads.find(t => t.status !== 'closed') || threads[0] || null;
    callback(open);
  });
}

export function subscribeToAllThreads(callback: (threads: ChatThread[]) => void) {
  const q = query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatThread)));
  });
}

export async function createThread(userId: string, username: string, subject: string): Promise<string> {
  const ref = await addDoc(collection(db, 'chats'), {
    userId, username, subject,
    status: 'open',
    unreadAdmin: 1,
    unreadUser: 0,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function closeThread(threadId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', threadId), { status: 'closed' });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function subscribeToMessages(
  threadId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, 'chats', threadId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
  });
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  senderName: string,
  senderRole: 'user' | 'admin',
  content: string,
  file?: { url: string; type: string; name: string }
): Promise<void> {
  await addDoc(collection(db, 'chats', threadId, 'messages'), {
    threadId, senderId, senderName, senderRole, content,
    ...(file ? { fileUrl: file.url, fileType: file.type, fileName: file.name } : {}),
    edited: false,
    deletedForUser: false,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'chats', threadId), {
    lastMessage: content || '📎 Attachment',
    lastMessageAt: serverTimestamp(),
    ...(senderRole === 'user' ? { unreadAdmin: 1 } : { unreadUser: 1 }),
  });
}

export async function editMessage(threadId: string, messageId: string, newContent: string): Promise<void> {
  await updateDoc(doc(db, 'chats', threadId, 'messages', messageId), {
    content: newContent,
    edited: true,
  });
}

export async function deleteMessageForUser(threadId: string, messageId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', threadId, 'messages', messageId), {
    deletedForUser: true,
    content: 'This message was removed.',
  });
}

export async function markThreadRead(threadId: string, role: 'user' | 'admin'): Promise<void> {
  await updateDoc(doc(db, 'chats', threadId), {
    ...(role === 'admin' ? { unreadAdmin: 0 } : { unreadUser: 0 }),
  });
}
