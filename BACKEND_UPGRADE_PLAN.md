# Durex Team Platform — Backend Upgrade Plan

> This document captures everything that is currently limited, deferred, or impossible
> without a dedicated backend server. When the platform is ready to upgrade from
> serverless (Firebase only) to a full backend (Node.js / Express / serverless functions),
> execute these items in order.

---

## Why Upgrade?

The current architecture is **100% client-side + Firestore**. This is intentional for cost
efficiency at early stage. However, several features are either insecure, unreliable, or
impossible without server-side code. This document is the upgrade checklist.

---

## 1. SECURITY — Critical Upgrades

### 1.1 — Vault PIN Validation (Move Server-Side)
**Current:** PIN hash is validated client-side in `VaultGate.tsx`. The hash is read from
Firestore and compared in the browser. Anyone who intercepts the Firestore read can extract
the hash and brute-force it offline.
**Upgrade:** Cloud Function / API route receives the PIN, validates against a stored secret
(environment variable, not Firestore), returns a signed JWT or session token. Client never
sees the hash.
**Files:** `src/components/vault/VaultGate.tsx`, `src/lib/platformSettings.ts`

### 1.2 — Cloudinary Signed Uploads (Move Server-Side)
**Current:** Cloudinary uploads fall back to unsigned upload preset when the Netlify function
is unavailable. Unsigned uploads allow anyone to upload to your Cloudinary account.
**Upgrade:** Deploy a backend endpoint (`POST /api/sign-cloudinary`) that generates a signed
upload signature using `CLOUDINARY_API_SECRET`. The client sends the file + signature — never
the secret itself.
**Files:** `src/lib/cloudinary.ts`, `netlify/functions/sign-cloudinary.ts`
**Env needed:** `CLOUDINARY_API_SECRET`

### 1.3 — Admin Password Storage
**Current:** Admin passwords are stored in plain text in `admin_secrets/{uid}` Firestore
collection. Even though it's super-admin read only, plain text storage is never acceptable.
**Upgrade:** Hash all passwords with bcrypt before storage. Provide a migration script that
reads all `admin_secrets` docs and overwrites with `bcrypt.hash(password, 12)`. Remove the
plain text password from `VaultSignup.tsx` write.
**Files:** `src/pages/auth/VaultSignup.tsx`, migration script needed

---

## 2. FINANCIAL INTEGRITY — Critical Upgrades

### 2.1 — Atomic Balance Updates
**Current:** When an admin approves a deposit, the transaction `status` changes to `approved`
but the user's `balance` field is updated in a separate `updateDoc` call. These are not
atomic — a failure between the two writes leaves the transaction approved but the balance
unchanged. Money is approved but never credited.
**Upgrade:** Firebase Cloud Function triggered on `transactions/{id}` update. When
`status` changes to `'approved'`, use a Firestore transaction to atomically:
1. Increment `users/{userId}.balance` by `transaction.amount`
2. Write an audit log entry
3. Send the payment confirmed auto-message
**Files:** `firebase-functions/index.ts`, `src/pages/admin/Payments.tsx`

### 2.2 — Client-Side Balance Deduction
**Current:** Marketplace purchases deduct balance via `updateDoc` called directly from the
browser. A user can intercept and modify the deduction amount using browser dev tools.
**Upgrade:** Cloud Function `onCall` (`processPurchase`) that:
1. Validates the user has sufficient balance
2. Atomically deducts balance and creates the order
3. Returns the receipt
**Files:** `src/pages/user/Cart.tsx`, new Cloud Function `processPurchase`

### 2.3 — Transaction Immutability
**Current:** Firestore rules prevent users from modifying transactions after creation, but
there is no server-side validation of the submitted amount. A user could create a
transaction with `amount: 999999` directly against Firestore.
**Upgrade:** Validate `amount` on the server before the Firestore write. Add Cloud Function
`createDepositRequest` that validates amount range, rate-limits per user, and creates the
transaction.
**Files:** `src/pages/user/Wallet.tsx`, new Cloud Function `createDepositRequest`

---

## 3. BOT SERVICE — Full Execution

### 3.1 — Telegram Webhook Endpoint
**Current (half-build):** Users can subscribe and configure their Telegram bot (token,
greeting, keywords). No webhook executes — the bot does not actually respond to messages.
**Upgrade:** Deploy a backend endpoint (Cloudflare Worker or Express server) as the Telegram
webhook. The worker:
1. Receives incoming Telegram updates (`POST /webhook/:userId`)
2. Reads the user's bot config from Firestore via Firebase REST API
3. Matches message text against configured keywords
4. Sends response via Telegram Bot API
**Files:** New file: `workers/telegram-bot.ts` (Cloudflare Worker)
**Env needed:** `FIREBASE_SERVICE_ACCOUNT_KEY` (for server-side Firestore reads)

### 3.2 — WhatsApp Bot (Future)
After Telegram is proven, the same worker pattern applies to WhatsApp via the Cloud API.
Requires a Meta Business account and a verified phone number.

### 3.3 — Discord Bot (Future)
Discord bot using Discord.js, hosted as a long-running Node.js process (not serverless,
due to the persistent WebSocket connection requirement).

### 3.4 — Bot Config Sync
**Current:** Bot config changes require the user to manually re-set the webhook URL after
each change.
**Upgrade:** When a user saves their bot config, a Cloud Function automatically calls the
Telegram Bot API `setWebhook` endpoint to register the new URL. No manual step needed.

---

## 4. EMAIL — Full SMTP Delivery

### 4.1 — Secure SMTP Credential Handling
**Current:** SMTP credentials are stored in Firestore `platform_settings/smtp_config`.
They are readable by any authenticated admin. EmailJS is used as the sending layer.
**Upgrade:** Move SMTP credentials to server-side environment variables. The backend
exposes a `POST /api/send-email` endpoint that accepts `{ to, subject, html }` and sends
using the server-stored credentials via Nodemailer. Credentials never touch the client.

### 4.2 — Reliable Scheduled Emails
**Current:** Scheduled emails fire client-side when the admin has the mail page open.
If no admin visits the page, scheduled emails never send.
**Upgrade:** A cron job (Cloud Scheduler) queries `scheduled_mails` for pending items
where `scheduledAt <= now`, sends them, and marks as sent. Runs every 5 minutes.

### 4.3 — Bulk Email Rate Limiting
**Current:** Pro plan users can send to entire contact lists in one browser call.
For large lists (500+), this will timeout or hit EmailJS rate limits.
**Upgrade:** A backend job queue (BullMQ or Cloud Tasks) processes bulk sends in batches
of 50 per minute, respecting SMTP provider rate limits.

---

## 5. REAL-TIME & PRESENCE

### 5.1 — Admin Presence (Reliable)
**Current:** Admin presence is tracked by writing to Firestore every 60 seconds from the
browser. If the browser tab crashes or loses connection, the presence doc is never cleaned up.
The widget ring may show green when no admin is actually available.
**Upgrade:** Use Firebase Realtime Database `onDisconnect()` handler instead of Firestore
polling. The presence doc is automatically removed when the connection drops.
**Files:** `src/lib/adminPresence.ts`

### 5.2 — Message Delivery Receipts
**Current:** Read receipts are tracked by updating the message doc from the browser.
If two clients write simultaneously, a race condition can produce incorrect read state.
**Upgrade:** Cloud Function triggered on message create/update handles read receipt
tracking atomically.

---

## 6. ANALYTICS & REPORTING

### 6.1 — Server-Side Analytics Aggregation
**Current:** Dashboard stats are computed by querying all matching documents client-side
(e.g., sum all `transactions` for revenue). For large datasets (1000+ docs), this is slow
and expensive (Firestore charges per read).
**Upgrade:** A daily Cloud Function aggregates stats into a `platform_stats/{date}` doc.
Dashboards read the aggregated doc — 1 read instead of thousands.

### 6.2 — CSV Export
**Current:** No export functionality exists.
**Upgrade:** Backend endpoint `GET /api/export/transactions?from=X&to=Y` streams a CSV
file. The client downloads it without loading all data into memory.

---

## 7. SEARCH

### 7.1 — Full-Text Search
**Current:** Search in Users, Products, Chat, and Audit Logs is client-side string matching
on already-loaded data. For large datasets, results are incomplete (only the first page is
searched).
**Upgrade:** Algolia or Typesense integration. A Cloud Function mirrors Firestore writes
to the search index. Client queries the search API instead of Firestore directly.

---

## 8. INFRASTRUCTURE CHECKLIST

When upgrading, set up these services in order:

| # | Service | Provider | Purpose |
|---|---------|----------|---------|
| 1 | Node.js API server | Railway / Render / Fly.io | Main backend |
| 2 | PostgreSQL (optional) | Neon / Supabase | If migrating off Firestore |
| 3 | Redis | Upstash | Session store + job queue |
| 4 | BullMQ | (with Redis) | Email queue + bot job queue |
| 5 | Cloud Scheduler | GCP | Cron jobs for scheduled emails |
| 6 | Cloudflare Workers | Cloudflare | Telegram bot webhook |
| 7 | Algolia | Algolia | Full-text search |

---

## 9. ENVIRONMENT VARIABLES NEEDED (Server-Side)

```env
# Firebase Admin (server-side Firestore/Auth access)
FIREBASE_SERVICE_ACCOUNT_KEY=<JSON string>
FIREBASE_PROJECT_ID=creatorspace-eaf29

# Cloudinary (signing)
CLOUDINARY_API_SECRET=<secret>
CLOUDINARY_CLOUD_NAME=<cloud>
CLOUDINARY_API_KEY=<key>

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_ADDRESS=

# Session
SESSION_SECRET=<random 64 chars>
JWT_SECRET=<random 64 chars>

# Telegram
TELEGRAM_BOT_WEBHOOK_SECRET=<random string for webhook verification>
```

---

## 10. MIGRATION ORDER (When Ready)

Execute in this order to avoid breaking the live platform:

1. **Deploy backend server** (API routes, no DB changes yet)
2. **Move Cloudinary signing** to backend — test uploads work
3. **Move Vault PIN validation** to backend — test staff login
4. **Deploy atomic balance Cloud Function** — test deposit approval
5. **Deploy purchase Cloud Function** — test marketplace checkout
6. **Move SMTP to backend** — test email delivery
7. **Deploy Telegram bot worker** — test with one user's token
8. **Add cron jobs** — test scheduled emails fire on time
9. **Add admin password hashing migration** — run once on all `admin_secrets` docs
10. **Enable full-text search** — index all existing data

---

*Created: June 2026. Update this document each time a backend feature is partially built.*
