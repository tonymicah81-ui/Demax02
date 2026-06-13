# Email System — Full Platform Plan

## Overview
A three-layer email infrastructure built entirely in the frontend (no dedicated backend) using EmailJS for delivery, Firestore for config/templates/logs, and a subscription model that lets users run their own email service.

---

## Architecture Notes (No Backend)
- All SMTP/DNS credentials are stored encrypted in Firestore (super admin writes, only they can read)
- Email sending goes through EmailJS SDK (free tier for testing, user provides paid service IDs)
- Zoho / Gmail / Yahoo SMTP are configured as EmailJS service connections — credentials stored in Firestore, loaded at send time
- Auto-messages are triggered by existing Firestore write events (project status change, subscription expiry, etc.) — no cron job needed
- User email subscription is a separate Firestore collection `email_subscriptions` with its own SMTP config per user

---

## Phase 1 — Super Admin: Email Settings Page

### What gets built
A new **"Email Settings"** tab inside `PlatformSettings.tsx` (alongside General, Vault, Loading, Cloudinary). The tab opens its own 3-section sub-navigation:

#### 1A — Email Templates
- Three template slots: **Support**, **Help**, **No-Reply / Auto**
- Each slot has:
  - A textarea to paste raw HTML + CSS (like EmailJS templates)
  - A live **Preview panel** (iframe srcdoc rendering the pasted HTML)
  - A variable legend showing available tokens: `{{username}}`, `{{email}}`, `{{amount}}`, `{{subscription}}`, `{{project}}`, `{{date}}`
- Saved to Firestore: `platform_settings/email_templates` → `{ support: { html, subject }, help: { html, subject }, noreply: { html, subject } }`

#### 1B — SMTP & DNS Settings
- **Provider selector** dropdown at the top: `EmailJS (Test)` | `Standard SMTP` | `Zoho Mail`
- Three **email type tabs** below selector: **Support** | **Help** | **No-Reply**
- Fields change based on provider:
  - **EmailJS**: Service ID, Template ID, Public Key
  - **Standard SMTP**: Host, Port, Username, Password, From Name, From Address (SSL toggle)
  - **Zoho Mail**: MX1 Host, MX2 Host, SMTP Host, Port, Username, Password, DKIM key, SPF record, From Address
- Each type saves independently to `platform_settings/smtp_config` → `{ support: {...}, help: {...}, noreply: {...} }`
- **Connection status bars** (green/red) at top and bottom of each form — persisted in Firestore after a successful test ping

#### 1C — Auto Messages
- List of trigger events with editable message for each:
  - Welcome (new user registers)
  - Project Completed (admin marks project done)
  - Project Status Changed
  - Subscription Activated
  - Subscription Expiring (3 days before)
  - Receipt / Payment Confirmed
  - Password Reset
- Each event has: Subject line, Body (uses template slot — dropdown to pick Support/Help/NoReply template), and editable body text with variable tokens (`$user`, `$subscription`, `$amount`, `$project`, `$date`)
- Toggle per event (on/off)
- Saved to `platform_settings/auto_messages`

### New Firestore collections/docs
- `platform_settings/email_templates`
- `platform_settings/smtp_config`
- `platform_settings/auto_messages`

### Firestore rules
- All three: `allow read: if isAdmin(); allow write: if isSuperAdmin();`

### Files created / modified
- `src/pages/superadmin/PlatformSettings.tsx` — add `email` tab to existing tabs array
- `src/pages/superadmin/email/EmailTemplates.tsx` — new
- `src/pages/superadmin/email/SmtpSettings.tsx` — new
- `src/pages/superadmin/email/AutoMessages.tsx` — new
- `src/lib/emailService.ts` — new (send functions, template renderer, variable substitutor)
- `src/lib/platformSettings.ts` — extend types for email_templates, smtp_config, auto_messages
- `firestore.rules` — add rules for new docs

---

## Phase 2 — Admin & Super Admin: Mail Page (PHP Mailer style)

### What gets built
A new **Mail** page accessible from the admin and superadmin sidebars. Sends emails to users using the platform's **Support** SMTP config.

#### Features
- **Recipient selector**: All Users | Specific User (searchable dropdown) | By Role | Manual email entry
- **Subject line** input
- **Template picker**: Use a saved template (Support/Help/NoReply) or build custom
- **Template Builder** (two modes, toggled):
  - **Paste Mode**: raw HTML textarea + live preview iframe
  - **Visual Builder**: drag-and-drop block builder with blocks:
    - Header (logo + title, editable)
    - Paragraph (text, font size, color)
    - Button (text, link, background color, border color, border radius, size)
    - Image (URL, width, border style, border color, border radius)
    - Divider (color, thickness)
    - Footer (text, links)
    - Spacer (height)
  - Each block has inline style controls (color pickers, dropdowns, text inputs)
  - Blocks reorderable (move up/down)
- **Variable insertion**: click to insert `{{username}}`, `{{email}}`, etc. at cursor
- **Button style options**: solid, outline, ghost — with color/border/radius controls
- **Schedule toggle**: Send Now vs Schedule (date + time picker)
- **Sent log**: history of sent mails in `mail_logs` Firestore collection (recipient, subject, sent_at, status, sender_uid)
- Sent mails use the platform Support SMTP config from Phase 1

### New Firestore collections
- `mail_logs` — `{ senderId, recipientEmail, recipientUserId?, subject, templateUsed, sentAt, scheduledAt?, status: 'sent'|'scheduled'|'failed' }`
- `scheduled_mails` — `{ senderId, recipients, subject, html, scheduledAt, status: 'pending'|'sent'|'cancelled' }`

### Firestore rules
- `mail_logs`: `allow read, create: if isAdmin();`
- `scheduled_mails`: `allow read, write: if isAdmin();`

### Files created / modified
- `src/pages/admin/Mail.tsx` — new (shared by admin + superadmin via same component)
- `src/components/mail/TemplateBuilder.tsx` — new (visual block builder)
- `src/components/mail/BlockEditor.tsx` — new (individual block with controls)
- `src/components/mail/PreviewPanel.tsx` — new (iframe preview)
- `src/lib/emailService.ts` — extend with `sendMail()`, `scheduleMail()`
- `src/App.tsx` — add `/admin/mail` and `/superadmin/mail` routes
- Navigation sidebars — add Mail link for admin + superadmin
- `firestore.rules` — add rules for mail_logs, scheduled_mails

---

## Phase 3 — User Email Subscription Service

### What gets built
Users can subscribe to an **Email Service** plan (priced by super admin via `subscription_models`). After subscribing, they get access to their own email infrastructure panel.

#### 3A — Subscription Plan
- New subscription model type: `email_service` (super admin creates via existing subscription_models Firestore collection)
- When user activates an `email_service` subscription on their project, a `email_subscriptions` Firestore doc is created for that user+project
- Subscription page already exists (`/subscription`) — email service appears as a plan card there
- After activation, **Email** menu item appears in the user sidebar

#### 3B — User Email Settings Page (`/email/settings`)
- Same structure as Phase 1B SMTP & DNS — but scoped to the user's own config
- Provider selector: Google (Gmail), Zoho, Yahoo, Standard SMTP, Custom
- Fields per provider (all the same credential fields)
- Each provider has connection status bar (green/red)
- Saved to `email_subscriptions/{userId}` → `{ smtpConfig: {...}, provider: '...', connectedAt, status }`
- User can configure multiple addresses (e.g. support@theirbusiness.com + noreply@theirbusiness.com)

#### 3C — User Email Templates Page (`/email/templates`)
- Same as Phase 1A but for the user's own templates
- Three slots: Support, Help, No-Reply
- Paste HTML or use Visual Builder (shared component from Phase 2)
- Saved to `email_subscriptions/{userId}` → `templates: { support, help, noreply }`

#### 3D — User Mail Page (`/email/mail`)
- Same PHP Mailer interface as Phase 2 but:
  - Uses the user's own SMTP config (not platform SMTP)
  - Recipients can be any email address (not just platform users)
  - Full visual builder + paste mode
  - Schedule + send now
  - Sent log scoped to the user

#### 3E — Admin: Manage User Email Subscriptions
- New tab in `UserDetails.tsx` — "Email Service"
- Shows user's subscription status, connected provider, last sent date
- Admin can set up / edit SMTP on behalf of user (support team builds it for them)
- Saved to same `email_subscriptions/{userId}` doc — admin writes, user reads

### New Firestore collections
- `email_subscriptions/{userId}` — `{ userId, projectId, provider, smtpConfig, templates, status: 'active'|'inactive', subscribedAt, expiresAt }`
- `user_mail_logs/{logId}` — `{ userId, recipientEmail, subject, sentAt, status }`
- `user_scheduled_mails/{id}` — `{ userId, recipients, subject, html, scheduledAt, status }`

### Firestore rules
- `email_subscriptions`: `allow read, write: if request.auth.uid == userId || isAdmin();`
- `user_mail_logs`: `allow read, create: if request.auth.uid == resource.data.userId || isAdmin();`
- `user_scheduled_mails`: `allow read, write: if request.auth.uid == resource.data.userId || isAdmin();`

### Files created / modified
- `src/pages/user/email/EmailSettings.tsx` — new
- `src/pages/user/email/EmailTemplates.tsx` — new
- `src/pages/user/email/UserMail.tsx` — new
- `src/pages/user/email/EmailLayout.tsx` — new (sub-navbar: Mail | Templates | Settings)
- `src/pages/admin/UserDetails.tsx` — add Email Service tab
- `src/lib/userEmailService.ts` — new (user-scoped send, schedule, log)
- `src/App.tsx` — add `/email/*` routes (protected, requires email subscription)
- User sidebar navigation — add Email link (conditional on active subscription)
- `firestore.rules` — add rules for new collections

---

## Phase 4 — Auto-trigger Wiring + Subscription Pricing

### What gets built
Connect the auto-messages from Phase 1C to real platform events, and let super admin set the email service subscription price.

#### 4A — Event Wiring
- `AuthContext.tsx` register function → trigger Welcome auto-message after user creation
- `src/pages/admin/Projects.tsx` status change → trigger Project Completed / Status Changed message
- `src/pages/user/Subscription.tsx` activate → trigger Subscription Activated message
- Receipt created → trigger Payment Confirmed message
- Each trigger calls `sendAutoMessage(eventType, userData)` from `emailService.ts`, which:
  1. Loads the auto_messages config from Firestore
  2. Checks if that event is enabled
  3. Loads the assigned template
  4. Substitutes variables
  5. Sends via the platform No-Reply SMTP

#### 4B — Subscription Pricing
- Super admin sets email service price in existing `subscription_models` Firestore collection
- New field on subscription model: `type: 'email_service'` — used to gate the user email menu
- Admin can create a subscription for a user manually from UserDetails → Email Service tab (marks as paid on behalf of user, logs a transaction)

### Files modified
- `src/AuthContext.tsx` — call sendAutoMessage on register
- `src/pages/admin/Projects.tsx` — call sendAutoMessage on status change
- `src/pages/user/Subscription.tsx` — call sendAutoMessage on activate
- `src/lib/receiptService.ts` — call sendAutoMessage on receipt create
- `src/lib/emailService.ts` — implement `sendAutoMessage()`

---

## Execution Order

| Phase | Effort | Dependency |
|-------|--------|------------|
| Phase 1 | Large | None — start here |
| Phase 2 | Large | Phase 1 (needs SMTP config + templates) |
| Phase 3 | Large | Phase 1 + 2 (reuses builder components) |
| Phase 4 | Medium | Phase 1 + 2 + 3 (wires everything together) |

---

## Firestore Rules Summary (all new additions)

```
// platform_settings already exists — extend existing rule to cover new docs
// (email_templates, smtp_config, auto_messages are under platform_settings/{docId})
// Existing rule: allow read: if true; allow write: if isSuperAdmin();
// ✅ Already covered — no new rule needed for Phase 1

// Phase 2
match /mail_logs/{id} {
  allow read, create: if isAdmin();
}
match /scheduled_mails/{id} {
  allow read, write: if isAdmin();
}

// Phase 3
match /email_subscriptions/{userId} {
  allow read, write: if isSignedIn() && request.auth.uid == userId || isSuperAdmin();
  allow read, write: if isAdmin();
}
match /user_mail_logs/{id} {
  allow read, create: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
}
match /user_scheduled_mails/{id} {
  allow read, write: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
}
```

---

## Key Design Decisions

1. **No backend** — EmailJS handles all actual sending. SMTP credentials are stored in Firestore (encrypted at rest by Firebase). Users accept this tradeoff when using the service.
2. **Visual builder is a shared component** — built once in Phase 2, reused in Phase 3 user mail page and both template editors.
3. **Email subscription gate** — the user email sidebar link only appears if `email_subscriptions/{uid}` exists and status is `active`. Checked in AuthContext or a dedicated hook.
4. **Scheduled mail** — stored in `scheduled_mails` Firestore, processed client-side on page load (if scheduled time has passed and status is pending). Not true server-side scheduling — fires when the admin has the page open or on next visit.
5. **SMTP config security** — credentials are stored in Firestore under super-admin-only write rules. They are never exposed in `VITE_*` env vars or client bundle. They are read at send time by the authenticated admin/user only.
