import {
  db, doc, collection, addDoc, updateDoc, setDoc, getDoc, serverTimestamp
} from "../firebase";

export interface VisitorConversation {
  visitorId: string;
  name: string;
  email: string;
  status: "open" | "closed";
  lastMessage: string;
  lastMessageAt: any;
  unreadAdmin: number;
  unreadVisitor: number;
  createdAt: any;
  source?: string;
}

export interface VisitorMessage {
  id: string;
  visitorId: string;
  text: string;
  sender: "visitor" | "admin";
  senderId?: string;
  senderName?: string;
  createdAt: any;
  read: boolean;
}

export function getVisitorId(): string {
  let id = localStorage.getItem("dt_vid");
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("dt_vid", id);
  }
  return id;
}

export async function startVisitorConversation(
  visitorId: string,
  name: string,
  email: string,
  source: string = "unknown"
): Promise<void> {
  const ref = doc(db, "visitor_conversations", visitorId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      visitorId,
      name,
      email,
      status: "open",
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      unreadAdmin: 0,
      unreadVisitor: 0,
      source,
      createdAt: serverTimestamp(),
    });
  } else if (snap.data().status === "closed") {
    await updateDoc(ref, { status: "open", name, email, updatedAt: serverTimestamp() });
  }
}

export async function sendVisitorMessage(visitorId: string, text: string): Promise<void> {
  await addDoc(collection(db, "visitor_messages"), {
    visitorId,
    text,
    sender: "visitor",
    createdAt: serverTimestamp(),
    read: false,
  });
  const ref = doc(db, "visitor_conversations", visitorId);
  const snap = await getDoc(ref);
  const cur = snap.data()?.unreadAdmin || 0;
  await updateDoc(ref, {
    lastMessage: text.slice(0, 120),
    lastMessageAt: serverTimestamp(),
    unreadAdmin: cur + 1,
  });
}

export async function sendAdminReplyToVisitor(
  visitorId: string,
  text: string,
  adminId: string,
  adminName: string
): Promise<void> {
  await addDoc(collection(db, "visitor_messages"), {
    visitorId,
    text,
    sender: "admin",
    senderId: adminId,
    senderName: adminName,
    createdAt: serverTimestamp(),
    read: false,
  });
  const ref = doc(db, "visitor_conversations", visitorId);
  const snap = await getDoc(ref);
  const cur = snap.data()?.unreadVisitor || 0;
  await updateDoc(ref, {
    lastMessage: text.slice(0, 120),
    lastMessageAt: serverTimestamp(),
    unreadVisitor: cur + 1,
  });
}

export async function markVisitorMessagesRead(visitorId: string, side: "admin" | "visitor"): Promise<void> {
  const ref = doc(db, "visitor_conversations", visitorId);
  await updateDoc(ref, {
    [side === "admin" ? "unreadAdmin" : "unreadVisitor"]: 0,
  });
}

export async function closeVisitorConversation(visitorId: string): Promise<void> {
  await updateDoc(doc(db, "visitor_conversations", visitorId), { status: "closed" });
}
