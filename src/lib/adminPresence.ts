import { db, doc, setDoc, onSnapshot, serverTimestamp, collection, getDocs, query, where } from "../firebase";

export interface PresenceDoc {
  uid: string;
  name: string;
  online: boolean;
  lastSeen: any;
}

export async function setAdminPresence(uid: string, name: string, online: boolean): Promise<void> {
  try {
    await setDoc(doc(db, "presence", uid), {
      uid,
      name,
      online,
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch {
    // Non-critical
  }
}

export function subscribeToAnyAdminOnline(callback: (online: boolean) => void): () => void {
  const q = query(collection(db, "presence"), where("online", "==", true));
  return onSnapshot(q, (snap) => {
    callback(!snap.empty);
  }, () => callback(false));
}

export function subscribeToPresence(uid: string, callback: (doc: PresenceDoc | null) => void): () => void {
  return onSnapshot(doc(db, "presence", uid), (snap) => {
    callback(snap.exists() ? snap.data() as PresenceDoc : null);
  }, () => callback(null));
}
