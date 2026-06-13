import { db, doc, getDoc, addDoc, collection, serverTimestamp } from '../firebase';

export interface SmtpConfig {
  provider: 'emailjs' | 'smtp' | 'zoho';
  serviceId?: string;
  templateId?: string;
  publicKey?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  fromName?: string;
  fromAddress?: string;
  ssl?: boolean;
  mx1?: string;
  mx2?: string;
  dkim?: string;
  spf?: string;
  connected?: boolean;
}

export interface EmailTemplateSlot {
  html: string;
  subject: string;
}

export interface EmailTemplates {
  support: EmailTemplateSlot;
  help: EmailTemplateSlot;
  noreply: EmailTemplateSlot;
}

export interface AutoMessageEvent {
  enabled: boolean;
  subject: string;
  body: string;
  templateSlot: 'support' | 'help' | 'noreply';
}

export interface AutoMessages {
  welcome: AutoMessageEvent;
  projectStatusChanged: AutoMessageEvent;
  projectCompleted: AutoMessageEvent;
  subscriptionActivated: AutoMessageEvent;
  subscriptionExpiring: AutoMessageEvent;
  paymentConfirmed: AutoMessageEvent;
  couponGranted: AutoMessageEvent;
  referralMilestone: AutoMessageEvent;
}

export const DEFAULT_AUTO_MESSAGES: AutoMessages = {
  welcome: { enabled: true, subject: 'Welcome to the platform!', body: 'Hi $user, welcome! Your account is ready.', templateSlot: 'noreply' },
  projectStatusChanged: { enabled: true, subject: 'Project Update — $project', body: 'Hi $user, your project "$project" status has been updated.', templateSlot: 'support' },
  projectCompleted: { enabled: true, subject: 'Project Completed — $project', body: 'Hi $user, your project "$project" is now complete!', templateSlot: 'support' },
  subscriptionActivated: { enabled: true, subject: 'Subscription Activated', body: 'Hi $user, your "$subscription" subscription is now active.', templateSlot: 'noreply' },
  subscriptionExpiring: { enabled: true, subject: 'Subscription Expiring Soon', body: 'Hi $user, your "$subscription" subscription expires in 3 days.', templateSlot: 'noreply' },
  paymentConfirmed: { enabled: true, subject: 'Payment Confirmed — $amount', body: 'Hi $user, your payment of $amount has been confirmed.', templateSlot: 'support' },
  couponGranted: { enabled: false, subject: 'You received a coupon!', body: 'Hi $user, a coupon code "$coupon" has been granted to your account.', templateSlot: 'noreply' },
  referralMilestone: { enabled: false, subject: 'Referral Milestone Reached!', body: 'Hi $user, you hit a referral milestone! Your reward has been applied.', templateSlot: 'noreply' },
};

export function substituteVars(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`$${k}`, v).replaceAll(`{{${k}}}`, v);
  }
  return out;
}

export async function loadEmailTemplates(): Promise<EmailTemplates> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'email_templates'));
    if (snap.exists()) return snap.data() as EmailTemplates;
  } catch {}
  return {
    support: { html: '', subject: '' },
    help: { html: '', subject: '' },
    noreply: { html: '', subject: '' },
  };
}

export async function loadSmtpConfig(): Promise<Record<string, SmtpConfig>> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'smtp_config'));
    if (snap.exists()) return snap.data() as Record<string, SmtpConfig>;
  } catch {}
  return {};
}

export async function loadAutoMessages(): Promise<AutoMessages> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'auto_messages'));
    if (snap.exists()) return { ...DEFAULT_AUTO_MESSAGES, ...snap.data() } as AutoMessages;
  } catch {}
  return DEFAULT_AUTO_MESSAGES;
}

export async function sendViaEmailJS(config: SmtpConfig, to: string, subject: string, html: string): Promise<void> {
  if (!config.serviceId || !config.templateId || !config.publicKey) {
    throw new Error('EmailJS config incomplete');
  }
  const { default: emailjs } = await import('@emailjs/browser');
  await emailjs.send(
    config.serviceId,
    config.templateId,
    { to_email: to, subject, message_html: html, message: html.replace(/<[^>]+>/g, '') },
    config.publicKey
  );
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  smtpType?: 'support' | 'help' | 'noreply';
  senderId?: string;
  recipientUserId?: string;
}): Promise<void> {
  const { to, subject, html, smtpType = 'support', senderId, recipientUserId } = params;
  const smtpConfigs = await loadSmtpConfig();
  const config = smtpConfigs[smtpType];
  if (!config) throw new Error('No SMTP config found for type: ' + smtpType);

  if (config.provider === 'emailjs') {
    await sendViaEmailJS(config, to, subject, html);
  } else {
    console.warn('Non-EmailJS providers require a backend proxy. Logging mail only.');
  }

  await addDoc(collection(db, 'mail_logs'), {
    senderId: senderId || null,
    recipientEmail: to,
    recipientUserId: recipientUserId || null,
    subject,
    templateUsed: smtpType,
    sentAt: serverTimestamp(),
    status: 'sent',
  });
}

export async function sendAutoMessage(
  eventKey: keyof AutoMessages,
  vars: Record<string, string>,
  toEmail: string
): Promise<void> {
  try {
    const [autoMessages, templates] = await Promise.all([loadAutoMessages(), loadEmailTemplates()]);
    const event = autoMessages[eventKey];
    if (!event?.enabled) return;

    const body = substituteVars(event.body, vars);
    const subject = substituteVars(event.subject, vars);
    const templateSlot = templates[event.templateSlot];
    const html = templateSlot?.html
      ? substituteVars(templateSlot.html, { ...vars, body, subject })
      : `<p>${body}</p>`;

    await sendMail({ to: toEmail, subject, html, smtpType: event.templateSlot });
  } catch (err) {
    console.warn('Auto message failed (non-blocking):', err);
  }
}

export async function logScheduledMail(params: {
  senderId: string;
  recipients: string[];
  subject: string;
  html: string;
  scheduledAt: Date;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'scheduled_mails'), {
    ...params,
    scheduledAt: params.scheduledAt.toISOString(),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
