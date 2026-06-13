import { db, doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from '../firebase';
import { sendViaEmailJS, SmtpConfig } from './emailService';

export type EmailTier = 'basic' | 'pro';

export interface UserEmailSubscription {
  userId: string;
  tier: EmailTier;
  smtpConfigs: UserSmtpConfig[];
  templates: {
    support: { html: string; subject: string };
    help: { html: string; subject: string };
    noreply: { html: string; subject: string };
  };
  provider: string;
  status: 'active' | 'inactive';
  subscribedAt: any;
  expiresAt: string | null;
}

export interface UserSmtpConfig extends SmtpConfig {
  label: string;
  emailAddress: string;
  connected: boolean;
}

const DEFAULT_TEMPLATES = {
  support: { html: '', subject: '' },
  help: { html: '', subject: '' },
  noreply: { html: '', subject: '' },
};

export async function getUserEmailSubscription(userId: string): Promise<UserEmailSubscription | null> {
  try {
    const snap = await getDoc(doc(db, 'email_subscriptions', userId));
    if (snap.exists()) return { userId: snap.id, ...snap.data() } as UserEmailSubscription;
  } catch {}
  return null;
}

export async function saveUserEmailSubscription(userId: string, data: Partial<UserEmailSubscription>): Promise<void> {
  await setDoc(doc(db, 'email_subscriptions', userId), {
    ...data,
    userId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function hasActiveEmailSubscription(userId: string): Promise<boolean> {
  const sub = await getUserEmailSubscription(userId);
  if (!sub || sub.status !== 'active') return false;
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return false;
  return true;
}

export async function sendUserMail(params: {
  userId: string;
  to: string[];
  subject: string;
  html: string;
  fromConfigIndex?: number;
}): Promise<void> {
  const { userId, to, subject, html, fromConfigIndex = 0 } = params;
  const sub = await getUserEmailSubscription(userId);
  if (!sub || sub.status !== 'active') throw new Error('No active email subscription');

  const config = sub.smtpConfigs?.[fromConfigIndex];
  if (!config) throw new Error('No SMTP config found');

  for (const toEmail of to) {
    if (config.provider === 'emailjs') {
      await sendViaEmailJS(config, toEmail, subject, html);
    } else {
      console.warn('Non-EmailJS providers require a backend proxy.');
    }

    await addDoc(collection(db, 'user_mail_logs'), {
      userId,
      recipientEmails: [toEmail],
      subject,
      fromAddress: config.emailAddress || config.fromAddress || '',
      sentAt: serverTimestamp(),
      status: 'sent',
    });
  }
}

export async function getUserContactLists(userId: string): Promise<any[]> {
  try {
    const { getDocs, query, where, orderBy } = await import('../firebase');
    const q = query(
      collection(db, 'email_contact_lists'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

export async function createContactList(userId: string, name: string, emails: string[]): Promise<string> {
  const ref = await addDoc(collection(db, 'email_contact_lists'), {
    userId,
    name,
    emails,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserMailLogs(userId: string): Promise<any[]> {
  try {
    const { getDocs, query, where, orderBy, limit } = await import('../firebase');
    const q = query(
      collection(db, 'user_mail_logs'),
      where('userId', '==', userId),
      orderBy('sentAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}
