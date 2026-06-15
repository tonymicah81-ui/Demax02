import { collection, doc, addDoc, updateDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const SESSION_KEY = 'easy_setup_session_id';
const SESSION_TTL_HOURS = 24;

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS);
  const ref = await addDoc(collection(db, 'sessions'), {
    userId,
    userAgent: navigator.userAgent,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    isActive: true,
  });
  localStorage.setItem(SESSION_KEY, ref.id);
  return ref.id;
}

export async function validateSession(): Promise<{ valid: boolean }> {
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return { valid: true }; // Fresh login — no session yet
  try {
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'sessions', sessionId));
    if (!snap.exists()) return { valid: false };
    const data = snap.data();
    if (!data.isActive) return { valid: false };
    const expiresAt: Timestamp = data.expiresAt;
    if (expiresAt.toDate() < new Date()) return { valid: false };
    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export async function getUserSessions(userId: string) {
  const q = query(collection(db, 'sessions'), where('userId', '==', userId), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function revokeSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), { isActive: false });
  if (localStorage.getItem(SESSION_KEY) === sessionId) {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function clearLocalSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
