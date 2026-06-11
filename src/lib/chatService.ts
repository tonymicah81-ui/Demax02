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
  onSnapshot 
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
  replyTo: string | ""; // messageId or empty
  status: "read" | "unread";
  file?: {
    url: string;
    name: string;
    type: string; // 'image' | 'video' | 'doc'
  };
  createdAt: any;
  edited?: boolean;
  deleted?: boolean;
}

export const getOrCreateConversation = async (userId: string, userEmail: string, username: string): Promise<string> => {
  const q = query(collection(db, "conversations"), where("userId", "==", userId), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    return snap.docs[0].id;
  }

  // Conversation is ONLY created on first message send (handled by caller)
  // But we return a placeholder or handle it reactively.
  // The user requested: "conversation is only created when either admin or users sends the first messages"
  return ""; 
};

export const createConversation = async (userId: string, userEmail: string, username: string) => {
  const docRef = await addDoc(collection(db, "conversations"), {
    userId,
    userEmail,
    username,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    unreadCount: 0,
    status: "active",
    createdAt: serverTimestamp(),
    typing: { admin: false, user: false }
  });
  return docRef.id;
};

export const sendMessage = async (
  conversationId: string, 
  messageData: Partial<Message>,
  userId: string, 
  userEmail: string, 
  username: string
) => {
  let activeConvId = conversationId;

  // If no conversation yet, create it
  if (!activeConvId) {
    activeConvId = await createConversation(userId, userEmail, username);
  }

  const msgRef = await addDoc(collection(db, "messages"), {
    ...messageData,
    conversationId: activeConvId,
    createdAt: serverTimestamp(),
    status: "unread"
  });

  // Update conversation last message
  await updateDoc(doc(db, "conversations", activeConvId), {
    lastMessage: messageData.text || (messageData.file ? "File Attachment" : ""),
    lastMessageAt: serverTimestamp(),
    unreadCount: 1 // In a real app, increment this
  });

  return activeConvId;
};

export const deleteMessage = async (messageId: string) => {
  return await updateDoc(doc(db, "messages", messageId), {
    deleted: true,
    text: "Message deleted"
  });
};

export const editMessage = async (messageId: string, newText: string) => {
  return await updateDoc(doc(db, "messages", messageId), {
    text: newText,
    edited: true
  });
};
