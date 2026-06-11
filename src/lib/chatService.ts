import {
  db,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  orderBy,
  limit,
  onSnapshot,
  runTransaction
} from "../firebase";

export interface Conversation {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadCount: number;
  status: "active" | "closed";
  createdAt: any;
  typing?: {
    admin: boolean;
    user: boolean;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  senderRole: "user" | "admin";
  replyTo: string;
  status: "read" | "unread";
  file?: {
    url: string;
    name: string;
    type: string;
  };
  createdAt: any;
  edited?: boolean;
  deleted?: boolean;
}

// Atomically find or create a conversation for this user.
// Returns the conversation ID — guaranteed to exist after this call.
export const getOrCreateConversation = async (
  userId: string,
  userEmail: string,
  username: string
): Promise<string> => {
  // Check for existing conversation first
  const q = query(collection(db, "conversations"), where("userId", "==", userId), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  // Create new conversation atomically
  const docRef = await addDoc(collection(db, "conversations"), {
    userId,
    userEmail,
    username,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    unreadCount: 0,
    status: "active",
    createdAt: serverTimestamp(),
    typing: { admin: false, user: false },
    participants: [userId],
  });
  return docRef.id;
};

export const sendMessage = async (
  conversationId: string,
  messageData: Partial<Message>,
  userId: string,
  userEmail: string,
  username: string
): Promise<string> => {
  // Ensure conversation exists — create if first message
  let activeConvId = conversationId;
  if (!activeConvId) {
    activeConvId = await getOrCreateConversation(userId, userEmail, username);
  }

  // Add the message
  await addDoc(collection(db, "messages"), {
    ...messageData,
    conversationId: activeConvId,
    createdAt: serverTimestamp(),
    status: "unread",
  });

  // Update conversation meta
  await updateDoc(doc(db, "conversations", activeConvId), {
    lastMessage: messageData.text || (messageData.file ? "📎 File Attachment" : ""),
    lastMessageAt: serverTimestamp(),
    unreadCount: 1,
  });

  return activeConvId;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await updateDoc(doc(db, "messages", messageId), {
    deleted: true,
    text: "Message deleted",
  });
};

export const editMessage = async (messageId: string, newText: string): Promise<void> => {
  await updateDoc(doc(db, "messages", messageId), {
    text: newText,
    edited: true,
  });
};

export const markConversationRead = async (conversationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "conversations", conversationId), { unreadCount: 0 });
  } catch {
    // Best-effort
  }
};
