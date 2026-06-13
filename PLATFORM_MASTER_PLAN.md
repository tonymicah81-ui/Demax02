# Platform Master Plan — All Phases

## What this document covers
All planned features across email infrastructure, business tools, and bot services.
Replaces `EMAIL_SYSTEM_PLAN.md`.

---

## Architecture Foundation (Firebase + Netlify, No Backend)
- All sending goes through EmailJS SDK — credentials stored in Firestore, read at send time
- No cron jobs — scheduled mails fire client-side on page load if time has passed
- PDF invoices generated entirely client-side using `html2pdf.js` (no server needed)
- Bot service foundation is data/config only in this phase — actual bot logic added when backend is funded
- Netlify Functions used only as a thin proxy for email sends (keeps SMTP credentials off the client bundle)

---

## Phase 1 — Super Admin: Email Settings

**Entry point:** New "Email Settings" tab in `PlatformSettings.tsx`
Opens its own 3-section sub-navigation: Templates | SMTP & DNS | Auto Messages

### 1A — Email Templates
- Three slots: **Support**, **Help**, **No-Reply / Auto**
- Each slot: paste HTML + CSS textarea, live iframe preview, variable token legend
- Tokens: `{{username}}`, `{{email}}`, `{{amount}}`, `{{subscription}}`, `{{project}}`, `{{date}}`
- Saved to: `platform_settings/email_templates → { support, help, noreply }`

### 1B — SMTP & DNS Settings
- Provider dropdown: **EmailJS (Test)** | **Standard SMTP** | **Zoho Mail**
- Sub-tabs per email type: **Support** | **Help** | **No-Reply**
- Fields per provider:
  - EmailJS: Service ID, Template ID, Public Key
  - Standard SMTP: Host, Port, SSL toggle, Username, Password, From Name, From Address
  - Zoho: MX1, MX2, SMTP Host, Port, Username, Password, DKIM, SPF, From Address
- Each type saves independently: `platform_settings/smtp_config → { support, help, noreply }`
- Green / red status bar at top and bottom after test connection (status persisted in Firestore)

### 1C — Auto Messages
- Trigger events (each with on/off toggle, subject, body, template slot picker):
  - Welcome (new user registers)
  - Project Status Changed
  - Project Completed
  - Subscription Activated
  - Subscription Expiring (3 days before)
  - Payment / Receipt Confirmed
  - Coupon Granted
  - Referral Milestone Reached
- Body uses variable tokens: `$user`, `$subscription`, `$amount`, `$project`, `$date`, `$coupon`
- Saved to: `platform_settings/auto_messages`

### Firestore (Phase 1)
- `platform_settings/email_templates` — admin read, superadmin write
- `platform_settings/smtp_config` — **admin read only** (contains credentials), superadmin write
- `platform_settings/auto_messages` — admin read, superadmin write
- Note: existing `platform_settings` rule (`read: true`) must be narrowed — smtp_config is sensitive

### Files
- `src/pages/superadmin/PlatformSettings.tsx` — add `email` tab
- `src/pages/superadmin/email/EmailTemplates.tsx` — new
- `src/pages/superadmin/email/SmtpSettings.tsx` — new
- `src/pages/superadmin/email/AutoMessages.tsx` — new
- `src/lib/emailService.ts` — new (send, template render, variable substitution)
- `src/lib/platformSettings.ts` — extend types
- `firestore.rules` — update platform_settings rule to restrict smtp_config to admins

---

## Phase 2 — Admin & Super Admin: Mail Page

**Entry point:** New "Mail" link in admin and superadmin sidebars

### Features
- **Recipient picker:** All Users | Specific User (searchable) | By Role | Manual email entry
- **Subject** input
- **Template mode toggle:**
  - **Paste Mode** — raw HTML + live iframe preview
  - **Visual Builder** — block-based composer with blocks:
    - Header (logo, title, background color)
    - Paragraph (text, font size, color, alignment)
    - Button (text, URL, bg color, border color, border radius, size: sm/md/lg, style: solid/outline/ghost)
    - Image (URL, width %, border style, border color, border radius)
    - Divider (color, thickness)
    - Footer (text, links, background)
    - Spacer (height in px)
  - Blocks are reorderable (move up / move down)
  - Each block has inline style controls (color pickers, dropdowns, number inputs)
- **Variable insertion** — click token to insert at cursor: `{{username}}`, `{{email}}`, etc.
- **Schedule toggle** — Send Now or pick date + time
- **Sent log** — table of sent mails with recipient, subject, date, status (sent/failed/scheduled)
- Uses platform **Support** SMTP from Phase 1

### Firestore (Phase 2)
- `mail_logs/{id}` — `{ senderId, recipientEmail, recipientUserId?, subject, templateUsed, sentAt, scheduledAt?, status }`
- `scheduled_mails/{id}` — `{ senderId, recipients[], subject, html, scheduledAt, status }`

### Files
- `src/pages/admin/Mail.tsx` — new (shared by admin + superadmin)
- `src/components/mail/TemplateBuilder.tsx` — new (visual block builder, reused in Phase 3)
- `src/components/mail/BlockEditor.tsx` — new
- `src/components/mail/PreviewPanel.tsx` — new
- `src/lib/emailService.ts` — extend with `sendMail()`, `scheduleMail()`
- `src/App.tsx` — add `/admin/mail`, `/superadmin/mail`
- Sidebars — add Mail link

---

## Phase 3 — User Email Subscription Service (Tiered)

### Two Subscription Tiers
Super admin creates both tiers as `subscription_models` with `type: 'email_service'` and `tier: 'basic'|'pro'`:

| Feature | Basic Plan | Pro Plan |
|---|---|---|
| Email addresses | 1 | Multiple (unlimited) |
| Template editor | ✅ Paste + Visual Builder | ✅ Paste + Visual Builder |
| Mail page (send to any address) | ✅ | ✅ |
| Bulk email (send to many) | ❌ | ✅ |
| Contact lists (save email groups) | ❌ | ✅ |
| Schedule sends | ✅ | ✅ |
| Sent log | ✅ | ✅ |
| Admin setup on behalf of user | ✅ | ✅ |

### 3A — Subscription Gating
- User activates Basic or Pro from `/subscription` page (plan appears there)
- `email_subscriptions/{userId}` doc created on activation with `tier` field
- **Email** link appears in user sidebar only when this doc exists and `status == 'active'`
- Sub-navbar inside Email section: **Mail** | **Templates** | **Contacts** (Pro only) | **Settings**

### 3B — User Email Settings (`/email/settings`)
- Provider selector: **Google (Gmail)** | **Zoho** | **Yahoo** | **Standard SMTP** | **Custom**
- Fields match provider (same pattern as Phase 1B)
- Basic: one email address configured
- Pro: add multiple email addresses (each gets its own SMTP config entry)
- Connection status bar (green/red) per configured address
- Saved to: `email_subscriptions/{userId} → { tier, smtpConfigs: [...], provider, status }`

### 3C — User Email Templates (`/email/templates`)
- Same 3 slots as Phase 1A (Support, Help, No-Reply)
- Same paste + Visual Builder (reused component from Phase 2)
- Saved to: `email_subscriptions/{userId} → templates: { support, help, noreply }`

### 3D — User Mail Page (`/email/mail`)
- Same interface as Phase 2 but uses user's own SMTP config
- Recipients: any email address (their customers — not platform users)
- **Basic:** single sender address, single recipient at a time
- **Pro additions:**
  - Add multiple recipients (type + add to list)
  - Load from saved contact list
  - Select from previously saved contacts
  - Send to entire contact list in one click
  - Choose which of their configured email addresses to send from

### 3E — Bulk Email & Contact Lists (Pro only, `/email/contacts`)
- Create named contact lists (e.g. "Newsletter", "Customers Jan 2026")
- Add emails manually (type + add) or paste a comma-separated block
- Edit / delete individual contacts
- Send directly to a list from this page
- Saved to: `email_contact_lists/{listId} → { userId, name, emails[], createdAt, updatedAt }`

### 3F — Admin: Manage User Email (`UserDetails.tsx` → Email Service tab)
- Shows: tier, status, connected provider, last sent date, contact list count
- Admin can edit SMTP config on behalf of user (support builds it for them)
- Admin can upgrade/downgrade tier
- Admin can manually create/renew the subscription (logs a transaction)

### Firestore (Phase 3)
- `email_subscriptions/{userId}` — `{ userId, tier, smtpConfigs, templates, provider, status, subscribedAt, expiresAt }`
- `email_contact_lists/{listId}` — `{ userId, name, emails[], createdAt, updatedAt }`
- `user_mail_logs/{id}` — `{ userId, recipientEmails[], subject, sentAt, fromAddress, status }`
- `user_scheduled_mails/{id}` — `{ userId, recipients[], subject, html, scheduledAt, fromAddress, status }`

### Files
- `src/pages/user/email/EmailLayout.tsx` — new (sub-navbar)
- `src/pages/user/email/UserMail.tsx` — new
- `src/pages/user/email/EmailTemplates.tsx` — new
- `src/pages/user/email/EmailSettings.tsx` — new
- `src/pages/user/email/ContactLists.tsx` — new (Pro only)
- `src/pages/admin/UserDetails.tsx` — add Email Service tab
- `src/lib/userEmailService.ts` — new
- `src/App.tsx` — add `/email/*` routes

---

## Phase 4 — Auto-trigger Wiring + Coupon & Referral System

### 4A — Auto-message Event Wiring
Connect Phase 1C triggers to real platform events:
- `AuthContext.tsx` register → fire Welcome message
- `admin/Projects.tsx` status change → fire Project Status Changed / Completed
- `user/Subscription.tsx` activate → fire Subscription Activated
- `receiptService.ts` create → fire Payment Confirmed
- Coupon granted → fire Coupon Granted message
- Referral milestone hit → fire Referral Milestone Reached message

Each trigger calls `sendAutoMessage(eventType, data)` from `emailService.ts`:
1. Load `platform_settings/auto_messages` from Firestore
2. Check if event is enabled
3. Load the assigned template slot
4. Substitute variable tokens
5. Send via No-Reply SMTP

### 4B — Coupon System

**Two coupon types:**
- `marketplace` — applies a discount when buying from the store (reduces order amount)
- `subscription` — applies a discount when activating a subscription plan

**Permission model:**
- Super admin: create, edit, delete, generate batch codes, set milestone rewards
- Admin: validate a coupon code (check if valid, not expired, not over usage limit), grant a coupon to a specific user (writes to `user_coupons`)
- User: enter coupon code at checkout / subscription activation

**Coupon fields:**
- `code` (unique string), `type` ('marketplace'|'subscription'), `discountType` ('percentage'|'fixed'), `value` (number), `usageLimit` (null = unlimited), `usedCount`, `expiresAt`, `minAmount` (optional min order/sub amount), `active`, `createdBy`, `description`

**Validation flow (client-side since no backend):**
1. User enters code → query `coupons` where code == input
2. Check: active, not expired, usedCount < usageLimit, type matches context
3. Apply discount to displayed total
4. On successful checkout: increment usedCount, write to `coupon_usages`

**Super Admin UI** — new "Coupons" tab in superadmin sidebar:
- List of all coupons (filterable by type, status)
- Create coupon form (all fields)
- Bulk generate: enter prefix + count → generates N unique codes
- Milestone rewards section: set referral milestone thresholds (e.g. 10 referrals = 20% coupon, 30 referrals = 50% coupon) — saved to `platform_settings/referral_settings`

**Admin UI** — new "Coupons" section in admin sidebar:
- Validate: enter code → see its status / remaining uses (read-only)
- Grant: search user → select coupon → write to `user_coupons/{id}`

### 4C — Referral System

**How it works:**
- Every user gets a unique referral code (generated on signup, stored on user doc `referralCode`)
- Referral link: `https://[domain]/signup?ref=[code]`
- When someone signs up with the code: write `referral_events` doc, increment `referrals/{userId}.totalReferrals`
- Milestone rewards checked automatically on each new referral: if threshold crossed, grant coupon to referrer

**Super Admin controls:**
- Set milestone thresholds + coupon reward in `platform_settings/referral_settings`
  - e.g. `[{ count: 10, rewardType: 'coupon', couponValue: 20, discountType: 'percentage', couponType: 'marketplace' }, { count: 30, ... }]`

**User Dashboard:**
- "Referral" card showing: their code, share link, total referrals, next milestone progress bar, rewards earned

### Firestore (Phase 4)
- `coupons/{couponId}` — full coupon doc (see fields above)
- `coupon_usages/{id}` — `{ couponId, userId, usedAt, orderId?, subscriptionId? }`
- `user_coupons/{id}` — `{ userId, couponId, grantedBy, grantedAt, used }` (admin-granted coupons)
- `referrals/{userId}` — `{ userId, referralCode, totalReferrals, milestonesReached[], createdAt }`
- `referral_events/{id}` — `{ referrerId, referredUserId, referralCode, createdAt, rewardGranted }`
- `platform_settings/referral_settings` — milestone config (superadmin write, admin read)

### Files
- `src/pages/superadmin/Coupons.tsx` — new
- `src/pages/admin/Coupons.tsx` — new (validate + grant only)
- `src/lib/couponService.ts` — new (validate, apply, redeem)
- `src/lib/referralService.ts` — new (generate code, track, milestone check)
- `src/AuthContext.tsx` — generate referral code on register, read ref param
- `src/pages/user/Dashboard.tsx` — add referral card
- `src/App.tsx` — add coupon + superadmin coupon routes
- Sidebars — add Coupons link (both admin and superadmin)

---

## Phase 5 — Project Milestones & Client Approval

### What gets built
Projects get a milestone timeline. Admin marks milestones done. Client must approve before the project advances.

### Admin side
- In project management: "Add Milestone" button per project
- Milestones have: title, description, order (drag to reorder)
- Admin marks a milestone as "Awaiting Client Approval" — triggers auto-message to client
- If client rejects: admin sees rejection note, milestone goes back to In Progress
- If client approves: milestone becomes Completed, project moves to next milestone

### Client (User) side
- Project detail page shows milestone timeline (visual progress bar + step list)
- Each "Awaiting Approval" milestone shows an Approve / Request Changes pair of buttons
- Request Changes opens a text box (sends note back to admin via notification)

### Firestore (Phase 5)
- `project_milestones/{id}` — `{ projectId, userId, title, description, order, status: 'pending'|'in_progress'|'awaiting_approval'|'revision_requested'|'approved'|'completed', revisionNote?, completedAt?, approvedAt?, createdAt }`
- Update `projects` update rule: allow `milestones`, `currentMilestone`, `milestoneCount` fields

### Files
- `src/pages/admin/Projects.tsx` — add milestone management panel
- `src/pages/user/Projects.tsx` — add milestone timeline + approval buttons
- `src/lib/milestoneService.ts` — new (create, update, approve, reject)

---

## Phase 6 — Invoice PDF Generator + Knowledge Base

### 6A — Invoice PDF Generator
- Every transaction and order gets a "Download Invoice" button
- Client-side generation using `html2pdf.js`
- Invoice contains: platform logo, invoice number (from receipt), client name + email, itemized list, total, payment date, platform support email
- Super admin can set invoice footer text in Platform Settings → General
- Admin can also generate invoices from `UserDetails` → Transactions tab

### 6B — Knowledge Base
**Admin/Superadmin side:**
- Manage articles: title, content (rich text — simple textarea with markdown), category, published toggle
- Manage KB categories: name, order
- Saved to Firestore

**User side:**
- Browse at `/help` — searchable article list by category
- Open article in full view
- "Was this helpful?" thumbs up/down (increments counter)

### Firestore (Phase 6)
- `kb_articles/{id}` — `{ title, content, category, published, helpful, notHelpful, createdBy, createdAt, updatedAt }`
- `kb_categories/{id}` — `{ name, slug, order }`
- `invoices/{id}` — `{ userId, transactionId, receiptNumber, amount, lineItems[], createdAt }` (metadata only — PDF generated on demand)

### Files
- `src/pages/user/Help.tsx` — new (knowledge base browse)
- `src/pages/admin/KnowledgeBase.tsx` — new (article management)
- `src/lib/invoiceService.ts` — new (PDF generation with html2pdf.js)
- `src/App.tsx` — add `/help`, `/admin/knowledge-base`
- Sidebars — add Help link (user), Knowledge Base link (admin)

---

## Phase 7 — CRM Lite (Lead Tracking)

### What gets built
A lightweight lead pipeline for the team to track potential clients who haven't signed up yet.

### Features
- **Kanban-style or table view** — columns: Cold → Contacted → Proposal Sent → Won → Lost
- Lead record: Name, Email, Phone, Source (Referral/Social/Direct/Other), Assigned To (admin), Notes, Follow-up Date, Created At
- **Filters:** by status, by assigned admin, by date range
- **Follow-up reminders** — leads with follow-up date = today are highlighted at the top
- Convert lead to user: pre-fills signup with lead's email + name, admin manually completes
- Won leads log a note and can be linked to a created user account

### Firestore (Phase 7)
- `leads/{id}` — `{ name, email, phone, source, status: 'cold'|'contacted'|'proposal'|'won'|'lost', assignedTo, notes, followUpDate, linkedUserId?, createdAt, updatedAt }`

### Files
- `src/pages/admin/CRM.tsx` — new
- `src/App.tsx` — add `/admin/crm`
- Sidebars — add CRM link (admin + superadmin)

---

## Phase 8 — Bot Services Foundation

### Purpose
Lay the data and config groundwork now so bot management can be activated once the backend is funded. No actual bot logic executes yet — this phase sets up the UI, the Firestore structure, and the admin-facing config panel.

### What gets built now
**Super Admin — Bot Settings** (new tab in Platform Settings):
- Bot types listed: Telegram Bot, WhatsApp Bot (coming soon), Discord Bot (coming soon)
- Telegram section:
  - Platform bot token field (for sending system notifications via Telegram)
  - Webhook URL display (shows the Netlify Function URL that will receive updates)
  - Test ping button

**User — Bot Subscription** (new subscription model type: `bot_service`):
- Users subscribe to a bot plan
- After subscribing, "Bot" appears in their sidebar
- Bot config page: enter their bot token, select bot type, configure greeting message, set webhook
- Status: shows Connected / Not Connected based on a stored flag
- Saved to `bot_subscriptions/{userId}`

**Admin — Manage User Bots** (new tab in UserDetails):
- View user's bot subscription status and configured bot type
- Admin can update bot config on behalf of user

### Firestore (Phase 8)
- `bot_subscriptions/{userId}` — `{ userId, tier, botType: 'telegram', token, chatId, webhookUrl, greetingMessage, status: 'active'|'inactive'|'pending', subscribedAt, expiresAt }`
- `bot_logs/{id}` — `{ userId, event, message, timestamp }` (for when actual bot fires)
- `platform_settings/bot_config` — platform-level bot token + webhook (superadmin write, admin read)

### Files
- `src/pages/superadmin/email/BotSettings.tsx` — new (tab in Platform Settings)
- `src/pages/user/BotService.tsx` — new
- `src/pages/admin/UserDetails.tsx` — add Bot tab
- `src/App.tsx` — add `/bot` route (gated on bot subscription)
- `src/lib/botService.ts` — new (config helpers, status check)

---

## Complete Firestore Rules — All Phases

```
// Phase 1: smtp_config is sensitive — override to admin-read-only
// Handled by narrowing existing platform_settings rule (see firestore.rules)

// Phase 2
match /mail_logs/{id} {
  allow read, create: if isAdmin();
}
match /scheduled_mails/{id} {
  allow read, write: if isAdmin();
}

// Phase 3
match /email_subscriptions/{userId} {
  allow read: if isSignedIn() && request.auth.uid == userId || isAdmin();
  allow write: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
}
match /email_contact_lists/{listId} {
  allow read, write: if isSignedIn() && resource.data.userId == request.auth.uid || isAdmin();
  allow create: if isSignedIn() && incoming().userId == request.auth.uid;
}
match /user_mail_logs/{id} {
  allow read, create: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
}
match /user_scheduled_mails/{id} {
  allow read, write: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
}

// Phase 4 — Coupons
match /coupons/{couponId} {
  allow read: if isSignedIn(); // users read to validate at checkout
  allow create, update, delete: if isSuperAdmin();
}
match /coupon_usages/{id} {
  allow read: if isAdmin();
  allow create: if isSignedIn() && incoming().userId == request.auth.uid;
}
match /user_coupons/{id} {
  allow read: if isSignedIn() && resource.data.userId == request.auth.uid || isAdmin();
  allow create, update: if isAdmin(); // admin grants coupons to users
}

// Phase 4 — Referrals
match /referrals/{userId} {
  allow read: if isSignedIn() && request.auth.uid == userId || isAdmin();
  allow create: if isSignedIn() && request.auth.uid == userId;
  allow update: if isAdmin() || (isSignedIn() && request.auth.uid == userId
    && incoming().diff(existing()).affectedKeys().hasOnly(['totalReferrals', 'milestonesReached']));
}
match /referral_events/{id} {
  allow read: if isAdmin() || (isSignedIn() && resource.data.referrerId == request.auth.uid);
  allow create: if isSignedIn();
}

// Phase 5 — Project Milestones
match /project_milestones/{id} {
  allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
  allow create: if isAdmin();
  allow update: if isAdmin() || (
    isSignedIn() && resource.data.userId == request.auth.uid
    && incoming().diff(existing()).affectedKeys().hasOnly(['status', 'revisionNote', 'approvedAt'])
    && incoming().status in ['approved', 'revision_requested']
  );
  allow delete: if isAdmin();
}

// Phase 6 — Invoices + Knowledge Base
match /invoices/{id} {
  allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
  allow create: if isAdmin() || (isSignedIn() && incoming().userId == request.auth.uid);
  allow delete: if isSuperAdmin();
}
match /kb_articles/{id} {
  allow read: if resource.data.published == true || isAdmin();
  allow write: if isAdmin();
}
match /kb_categories/{id} {
  allow read: if true;
  allow write: if isAdmin();
}

// Phase 7 — CRM Leads
match /leads/{id} {
  allow read: if isAdmin();
  allow create: if isAdmin();
  allow update: if isAdmin();
  allow delete: if isSuperAdmin();
}

// Phase 8 — Bot Services
match /bot_subscriptions/{userId} {
  allow read: if isSignedIn() && request.auth.uid == userId || isAdmin();
  allow write: if isAdmin() || (isSignedIn() && request.auth.uid == userId);
}
match /bot_logs/{id} {
  allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
  allow create: if isSignedIn();
}
```

---

## Updated Projects Rule (Phase 5 milestone fields)
The existing `projects` update rule needs new allowed keys:
```
allow update: if isAdmin() && (
  incoming().diff(existing()).affectedKeys()
    .hasOnly(['status', 'domainName', 'expiryDate', 'notes', 'updatedAt',
              'currentMilestone', 'milestoneCount', 'milestones'])
);
```

## Updated Platform Settings Rule (Phase 1 security fix)
Narrow the existing public `read: true` to protect SMTP credentials:
```
match /platform_settings/{docId} {
  allow read: if docId in ['loading', 'general'] || isAdmin();
  allow write: if isSuperAdmin();
}
```

---

## Execution Order

| Phase | Name | Effort | Depends On |
|-------|------|--------|------------|
| 1 | Super Admin Email Settings | Large | — |
| 2 | Admin Mail Page | Large | Phase 1 |
| 3 | User Email Subscription (Tiered + Bulk) | Large | Phase 1 + 2 |
| 4 | Auto-triggers + Coupons + Referrals | Large | Phase 1 + 3 |
| 5 | Project Milestones + Client Approval | Medium | — (independent) |
| 6 | Invoice PDF + Knowledge Base | Medium | — (independent) |
| 7 | CRM Lite | Small | — (independent) |
| 8 | Bot Services Foundation | Medium | Phase 3 (reuses subscription pattern) |

Phases 5, 6, 7 can be built in parallel with any email phase since they are fully independent.

---

## Key Design Decisions

1. **Email tiers are subscription_models** — Basic and Pro are just two entries in the existing `subscription_models` collection with `type: 'email_service'` and `tier: 'basic'|'pro'`. No new collection needed for tier definition.
2. **Coupon validation is client-side** — since there's no backend, the validation logic reads the coupon doc, checks constraints, and applies. The `usedCount` is incremented inside a Firestore `runTransaction` to prevent race conditions on popular codes.
3. **Referral code on signup** — generated with `Math.random().toString(36).slice(2, 8).toUpperCase()` in `AuthContext.register`, stored on the user doc and in `referrals/{userId}`.
4. **Milestone approval is user-triggered** — no backend event needed. Admin marks "awaiting approval" → user sees it via onSnapshot → user clicks approve/reject → Firestore write → admin sees update in real time.
5. **PDF invoices** — `html2pdf.js` runs entirely in the browser. The invoice HTML is built from a template string + transaction data. No file is stored in Cloudinary or Firestore — generated fresh on every download.
6. **Bot services are config-only** — actual Telegram message sending (when backend is ready) will be via a Netlify Function or Firebase Cloud Function. The UI and Firestore structure is ready for when that is wired in.
7. **Contact lists are Pro-gated** — the `/email/contacts` route and the contact list picker in UserMail both check `email_subscriptions/{uid}.tier == 'pro'` before rendering.
