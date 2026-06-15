import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { EmailSettings } from '@/types';

async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'config'));
    if (snap.exists()) return snap.data()?.email || { provider: 'emailjs' };
  } catch {}
  return { provider: 'emailjs' };
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  templateParams?: Record<string, string>;
}): Promise<void> {
  const settings = await getEmailSettings();

  if (settings.provider === 'emailjs') {
    // EmailJS — client-side send
    if (!settings.emailjsServiceId || !settings.emailjsPublicKey) {
      throw new Error('EmailJS not configured. Set up email in Super Admin → Email Settings.');
    }
    const emailjs = await import('@emailjs/browser');
    await emailjs.send(
      settings.emailjsServiceId,
      settings.emailjsTemplateId || '',
      { to_email: params.to, subject: params.subject, message: params.body, ...params.templateParams },
      settings.emailjsPublicKey
    );
  } else {
    // SMTP — send via API route
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: params.to, subject: params.subject, body: params.body }),
    });
    if (!res.ok) throw new Error('Failed to send email via SMTP');
  }
}
