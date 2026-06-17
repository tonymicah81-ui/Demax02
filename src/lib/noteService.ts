import {
  db, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy
} from "../firebase";

export interface UserNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  pinned: boolean;
  createdAt: any;
  updatedAt?: any;
}

export function subscribeToNotes(userId: string, callback: (notes: UserNote[]) => void): () => void {
  const q = query(
    collection(db, "user_notes", userId, "notes"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserNote[]);
  }, () => callback([]));
}

export async function addNote(
  userId: string,
  text: string,
  authorId: string,
  authorName: string
): Promise<void> {
  await addDoc(collection(db, "user_notes", userId, "notes"), {
    text,
    authorId,
    authorName,
    pinned: false,
    createdAt: serverTimestamp(),
  });
}

export async function updateNote(userId: string, noteId: string, text: string): Promise<void> {
  await updateDoc(doc(db, "user_notes", userId, "notes", noteId), {
    text,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleNotePin(userId: string, noteId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(db, "user_notes", userId, "notes", noteId), { pinned });
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, "user_notes", userId, "notes", noteId));
}
