import { db, doc, getDoc, addDoc, collection, serverTimestamp } from "../firebase";

export interface PlatformBotConfig {
  token: string;
  chatId: string;
  enabled: boolean;
  events: {
    newUser: boolean;
    newDeposit: boolean;
    newOrder: boolean;
    newFix: boolean;
    newVisitorChat: boolean;
  };
}

export async function getPlatformBotConfig(): Promise<PlatformBotConfig | null> {
  try {
    const snap = await getDoc(doc(db, "platform_settings", "platform_bot"));
    if (snap.exists()) return snap.data() as PlatformBotConfig;
  } catch {}
  return null;
}

export async function sendPlatformBotNotification(
  event: keyof PlatformBotConfig["events"],
  message: string
): Promise<void> {
  try {
    const config = await getPlatformBotConfig();
    if (!config || !config.enabled || !config.events[event]) return;
    if (!config.token || !config.chatId) return;

    await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // Non-critical — never block the main action
  }
}

export async function testPlatformBotToken(token: string, chatId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Platform bot connected successfully!",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function logBotEvent(userId: string, event: string, details: string): Promise<void> {
  try {
    await addDoc(collection(db, "bot_logs"), {
      userId,
      event,
      details,
      createdAt: serverTimestamp(),
    });
  } catch {}
}
