import { db, doc, getDoc, setDoc, serverTimestamp } from '../firebase';

export type BotType = 'telegram';
export type BotStatus = 'active' | 'inactive' | 'pending';

export interface BotSubscription {
  userId: string;
  tier: string;
  botType: BotType;
  token: string;
  chatId: string;
  webhookUrl: string;
  greetingMessage: string;
  status: BotStatus;
  subscribedAt: any;
  expiresAt: string | null;
}

export async function getBotSubscription(userId: string): Promise<BotSubscription | null> {
  try {
    const snap = await getDoc(doc(db, 'bot_subscriptions', userId));
    if (snap.exists()) return { userId: snap.id, ...snap.data() } as BotSubscription;
  } catch {}
  return null;
}

export async function saveBotSubscription(userId: string, data: Partial<BotSubscription>): Promise<void> {
  await setDoc(doc(db, 'bot_subscriptions', userId), {
    ...data,
    userId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getBotPlatformConfig(): Promise<any> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'bot_config'));
    if (snap.exists()) return snap.data();
  } catch {}
  return {};
}

export function getTelegramBotUrl(token: string): string {
  return `https://api.telegram.org/bot${token}`;
}

export async function testTelegramToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}
