import { db, collection, addDoc, serverTimestamp } from "../firebase";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const code = Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
  return `DT-${year}-${code}`;
}

export interface ReceiptPayload {
  receiptNumber: string;
  orderId: string;
  transactionId: string;
  userId: string;
  userEmail: string;
  username: string;
  items: { name: string; price: number }[];
  total: number;
}

export async function createReceipt(payload: ReceiptPayload): Promise<void> {
  await addDoc(collection(db, "receipts"), {
    ...payload,
    issuedAt: serverTimestamp(),
  });
}
