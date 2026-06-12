import { db, collection, addDoc, doc, updateDoc, serverTimestamp, getDoc } from "../firebase";

const SESSION_ID_KEY = "dt_sid";
const SESSION_DURATION_MS = 48 * 60 * 60 * 1000;

export interface SessionDoc {
  id: string;
  userId: string;
  role: string;
  createdAt: any;
  expiresAt: string;
  lastActive: any;
  deviceInfo: string;
  active: boolean;
  revokedAt?: string;
  revokedBy?: string;
}

export async function createSession(userId: string, role: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const ref = await addDoc(collection(db, "sessions"), {
    userId,
    role,
    createdAt: serverTimestamp(),
    expiresAt,
    lastActive: serverTimestamp(),
    deviceInfo: navigator.userAgent.slice(0, 200),
    active: true,
  });
  localStorage.setItem(SESSION_ID_KEY, ref.id);
  localStorage.setItem("dt_session_expires", expiresAt);
  return ref.id;
}

export async function validateAndRefreshSession(): Promise<{ valid: boolean; expiresAt?: string }> {
  const sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) return { valid: false };

  try {
    const snap = await getDoc(doc(db, "sessions", sessionId));
    if (!snap.exists()) return { valid: false };

    const data = snap.data() as SessionDoc;
    if (!data.active) return { valid: false };

    if (new Date(data.expiresAt) < new Date()) {
      await updateDoc(doc(db, "sessions", sessionId), { active: false });
      localStorage.removeItem(SESSION_ID_KEY);
      localStorage.removeItem("dt_session_expires");
      return { valid: false };
    }

    await updateDoc(doc(db, "sessions", sessionId), { lastActive: serverTimestamp() });
    return { valid: true, expiresAt: data.expiresAt };
  } catch {
    return { valid: false };
  }
}

export async function extendSession(): Promise<void> {
  const sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) return;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await updateDoc(doc(db, "sessions", sessionId), {
    expiresAt,
    lastActive: serverTimestamp(),
  });
  localStorage.setItem("dt_session_expires", expiresAt);
}

export async function revokeSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionId), {
    active: false,
    revokedAt: new Date().toISOString(),
  });
}

export async function revokeSessionByAdmin(sessionId: string, adminId: string): Promise<void> {
  await updateDoc(doc(db, "sessions", sessionId), {
    active: false,
    revokedAt: new Date().toISOString(),
    revokedBy: adminId,
  });
}

export async function clearCurrentSession(): Promise<void> {
  const sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (sessionId) {
    try {
      await revokeSession(sessionId);
    } catch {}
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem("dt_session_expires");
  }
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(SESSION_ID_KEY);
}

export function getLocalSessionExpiry(): string | null {
  return localStorage.getItem("dt_session_expires");
}
