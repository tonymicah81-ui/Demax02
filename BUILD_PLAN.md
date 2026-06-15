# Durex Team Platform — Build Plan

> Full audit completed June 2026. This document covers every known issue,
> bad terminology, fake/hardcoded data, missing feature, and new feature
> to be built. Organized into phases from quickest-win to most complex.
> Execute phases in order — earlier phases unblock later ones.

---

## AUDIT SUMMARY

### Auth Pages — Mobile Responsiveness
All five auth pages (Login, Signup, VaultLogin, VaultSignup, StaffLogin) use
`max-w-md w-full` and `p-4` — technically responsive classes — but the **visual
layout has no real mobile-first treatment**: no logo stacking, no proper
touch-target sizing, no adjusted font scales, no mobile-friendly spacing between
form fields. Needs a proper mobile pass on each.

---

### Bad Terminology Found (Full List)

These are the exact strings that need to be replaced across the codebase.
They follow a "cyberpunk / technical jargon" style that is confusing and
unprofessional for real clients.

#### User Dashboard (`src/pages/user/Dashboard.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Authorized Human"` | User's actual username |
| `"Durex Engine Platform // v1.2 Operational // Status Locked"` | `"DT Platform"` or remove |
| `"Time Sync"` | `"Current Time"` |
| `"Project Evolution"` | `"My Projects"` |
| `"Nodes"` | `"Projects"` |
| `"Accessing Cloud Files..."` | `"Loading projects..."` |
| `"Awaiting Engine Data"` | `"No projects yet"` |
| `"Access Signal Terminal"` | `"View Notifications"` |
| `"Initialize Fix Request"` | `"Submit a Fix Request"` |
| `"Protocol DT-X"` | Remove label entirely |
| `placeholder="SPECIFY_ANOMALY..."` | `placeholder="Describe your issue..."` |
| `"PROPOSE RESTORATION_"` | `"Submit Request"` |
| `"Professional Expansion"` and `"functional empire"` | Proper CTA copy or remove section |
| `"Operational Efficiency +12%"` | Remove (hardcoded fake metric) |
| `"Verified"` hardcoded security status | Remove or make dynamic |
| `"NO_DOMAIN_ALLOCATED"` | `"No domain assigned"` |

#### Admin Dashboard (`src/pages/admin/Dashboard.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Auth_Middleware::Active"` | `"Authentication Active"` or remove |
| `"Firestore_Grip::Enabled"` | `"Database Connected"` or remove |
| `"Sessions::Tracked"` | `"Sessions Active"` or remove |
| `"Optimal"` (hardcoded health) | Real status or remove widget |
| `88.4%` progress bar | Remove (completely fake) |
| `"Admin Action"` on audit logs | Use actual audit log action type |
| `"All Systems Online"` | Remove or make real |
| `"Logged"` hardcoded status | Use actual log status |

#### Super Admin Dashboard (`src/pages/superadmin/Dashboard.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Core_Stabilized::Full_Access"` | Remove decorative status |
| `"COMMIT_SYNC_PARAMS"` button | `"Save Bank Details"` |
| `placeholder="GLOBAL_BANK..."` | `placeholder="Bank name"` |
| `placeholder="SOURCE_ARCHITECT..."` | `placeholder="Account holder name"` |
| `placeholder="USE_SOURCE_UID..."` | `placeholder="Reference / note"` |
| `"fiscal parameters updated"` | `"Bank details saved"` |

#### Subscription Page (`src/pages/user/Subscription.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"User protocol not found"` | `"Account not found"` |
| `"Capital deficiency detected"` | `"Insufficient balance"` |
| `"Subscription_Hub"` | `"Subscriptions"` |
| `"Active Infrastructure Services // Ecosystem Maintenance"` | `"Active Services"` |
| `"Target Node Selection"` | `"Select Project"` |
| `"No Service Modules Available"` | `"No services available"` |
| `"Renewal Protocol"` | `"Renewal"` |
| `"FISCAL TERMINAL"` | `"Wallet Balance"` |
| Native `alert()` calls | Inline error/success messages |

#### Broadcast Page (`src/pages/admin/Broadcast.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Signal_Broadcaster"` | `"Broadcast"` |
| `"Mass Protocol Messaging // Multi-Node Relay"` | `"Send announcements to users"` |
| `"Protocol Selection"` | `"Broadcast Type"` |
| `"Global Relay"` | `"All Users"` |
| `"Targeted Node"` | `"Specific User"` |
| `"Transmission Title"` | `"Title"` |
| `"Relay Content"` | `"Message"` |
| `"SIGNAL_TRANSMITTED"` | `"Broadcast Sent"` |
| `"INITIATE_BROADCAST"` | `"Send Broadcast"` |
| `"Transmission_Log"` | `"Broadcast History"` |

#### Wallet Page (`src/pages/user/Wallet.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Balance_Vault"` | `"My Wallet"` |
| `"STATUS: LIQUID_READY"` | Remove decorative label |
| `"DATA_P"` | Remove |

#### Profile Page (`src/pages/user/Profile.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Verified Engine"` | `"Verified"` |
| `"All protocols green"` | `"Account in good standing"` |
| `IP_ADDR: 192.XXX.XX.XX` | Remove fake IP entirely |
| `DEVICE: DESKTOP_PROTOCOL_OS` | Remove fake device string |
| `"Modify Identification"` (dead button) | Wire up or remove |
| `"System Settings"` (dead button) | Wire up or remove |

#### Payments Page (`src/pages/admin/Payments.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `94.2%` success rate | Remove (hardcoded fake stat) |
| `"Volume Growing"` | Remove (hardcoded fake label) |

---

### Hardcoded Fake Data Found (Full List)

| File | Issue | Fix |
|---|---|---|
| `user/Wallet.tsx` line 58 | Proof image = `picsum.photos` URL | Upload to Cloudinary |
| `user/Profile.tsx` line 20 | Profile photo = `picsum.photos` | Upload to Cloudinary |
| `admin/Issues.tsx` entire file | All issues are a hardcoded JS array | Connect to Firestore |
| `admin/Issues.tsx` line 69 | "Mark as Resolved" does nothing | Wire to Firestore update |
| `admin/Dashboard.tsx` line 182 | Health bar = hardcoded `88.4%` | Remove widget |
| `admin/Payments.tsx` line 167 | Success rate = hardcoded `94.2%` | Remove stat |
| `admin/Payments.tsx` line 172 | "Volume Growing" = hardcoded | Remove stat |
| `user/Dashboard.tsx` line 139 | `+12%` efficiency = hardcoded | Remove stat |

---

### Incomplete / Broken Features (Full List)

| Feature | File | What's Missing |
|---|---|---|
| Wallet proof upload | `user/Wallet.tsx` | Real Cloudinary upload (just saves filename now) |
| Profile photo upload | `user/Profile.tsx` | Real Cloudinary upload (shows picsum) |
| Profile buttons | `user/Profile.tsx` | "Modify Identification" and "System Settings" have no onClick |
| Admin Issues page | `admin/Issues.tsx` | Entire page is fake — needs Firestore collection + CRUD |
| Fixes — Notify User | `admin/Fixes.tsx` | Button exists but sends no notification |
| Subscription alerts | `user/Subscription.tsx` | Uses native browser `alert()` — ugly on mobile |
| CRM delete confirm | `admin/CRM.tsx` | Uses native `confirm()` dialog |
| KB delete confirm | `admin/KnowledgeBase.tsx` | Uses native `confirm()` dialog |
| Bot execution | `user/BotService.tsx` | Config saves but bot never runs (labeled "Next Phase") |
| Product category | `admin/Marketplace.tsx` | Single `categoryId` only — no multi-tag support |

---

## PHASES

---

## Phase 1 — Terminology & Fake Data Cleanup
**Goal:** Make the platform look and feel professional for real clients.
**Effort:** 1–2 sessions. Zero new features, just text and dead code removal.
**Impact:** Immediate — clients see real labels, no fake numbers, no robot-speak.

### Tasks
- [ ] Fix all bad terminology in User Dashboard
- [ ] Fix all bad terminology in Admin Dashboard
- [ ] Fix all bad terminology in Super Admin Dashboard
- [ ] Fix all bad terminology in Subscription page (replace native `alert()` too)
- [ ] Fix all bad terminology in Broadcast page
- [ ] Fix all bad terminology in Wallet page
- [ ] Fix Profile page — remove fake IP, fake device, fix status labels
- [ ] Remove hardcoded fake metrics (88.4%, 94.2%, +12%, "Volume Growing")
- [ ] Fix placeholder texts in Super Admin bank details form
- [ ] Replace native `confirm()` dialogs in CRM and KnowledgeBase with inline modals

---

## Phase 2 — Mobile Design Pass (Auth + Key Pages)
**Goal:** Make auth pages and dashboards look clean on phone screens.
**Effort:** 1 session.
**Impact:** Any client opening the link on their phone gets a proper experience.

### Auth Pages (all 5 need a mobile pass)
- [ ] `Login.tsx` — proper logo, large touch targets, comfortable vertical spacing
- [ ] `Signup.tsx` — single-column layout on mobile, larger field height
- [ ] `VaultLogin.tsx` — match Login mobile treatment
- [ ] `VaultSignup.tsx` — match Signup mobile treatment
- [ ] `StaffLogin.tsx` — match Login mobile treatment

### Dashboard Mobile Pass
- [ ] User Dashboard — fix stat cards stacking, chart overflow on small screens
- [ ] Admin Dashboard — fix table overflow, card layout on mobile
- [ ] Super Admin Dashboard — fix form layout on mobile

---

## Phase 3 — Fix Proof Upload & Profile Photo
**Goal:** Real file uploads instead of fake placeholder images.
**Effort:** 1 session. Uses Cloudinary (already configured).
**Impact:** Admin can actually see payment proof. Users have real profile photos.

### Tasks
- [ ] `user/Wallet.tsx` — wire the image picker to `uploadToCloudinary()`,
      save the real `secure_url` to Firestore instead of picsum URL
- [ ] `user/Profile.tsx` — add profile photo upload using `uploadToCloudinary()`,
      save photo URL to `users/{uid}` in Firestore
- [ ] Remove "Modify Identification" and "System Settings" dead buttons OR
      wire "Modify Identification" to open a profile edit modal (username, phone)
- [ ] `admin/Payments.tsx` — proof viewer now shows real image from Cloudinary URL

---

## Phase 4 — Admin Issues Page (Full Build)
**Goal:** Replace the 100% hardcoded Issues page with a real Firestore-backed system.
**Effort:** 1 session.
**Impact:** Admin can track real client issues submitted by users.

### Tasks
- [ ] Create `issues` Firestore collection with fields:
      `userId`, `title`, `description`, `status` (open/in_progress/resolved),
      `priority` (low/medium/high), `createdAt`, `updatedAt`, `adminNote`
- [ ] Add Firestore rule for `issues` collection
- [ ] Rebuild `admin/Issues.tsx`:
      - Real-time listener from `issues` collection
      - Status filter tabs (Open / In Progress / Resolved)
      - Search by title or user
      - "Mark as Resolved" / "Mark In Progress" updates Firestore
      - View issue details in a slide panel
- [ ] Connect user-side Fix Request form (User Dashboard) to `issues` collection
      so submissions actually appear in admin Issues page
- [ ] Wire "Notify User" button in `admin/Fixes.tsx` to create a `user_notifications` doc

---

## Phase 5 — Profile Edit Modal
**Goal:** Let users update their username and phone number.
**Effort:** Half a session.
**Impact:** Users can keep their profile current without contacting admin.

### Tasks
- [ ] Build inline profile edit modal (username, phone number fields)
- [ ] On save: `updateDoc(users/{uid}, { username, phoneNumber })`
- [ ] Log the change to `audit_logs`
- [ ] Wire the "Modify Identification" button on Profile page to open modal

---

## Phase 6 — Multi-Category Product Tagging
**Goal:** Let admin tag a product under multiple categories so it appears
in searches and filters for all matching categories.
**Effort:** 1 session.
**Impact:** Customers searching for "e-commerce" or "logistics" both find
the same affiliate marketing website product — more discoverability, more sales.

### How It Works
Currently, each product has a single `categoryId` string field.
The new system keeps `categoryId` as the **primary category** (required, existing
behaviour unchanged) and adds a new `tags` field — an **array of category IDs**
that the product also belongs to.

Search and filter on both the admin Marketplace page and the public Store
will match a product if the search term matches the primary category **or**
any of its tags.

### Firestore Changes
- Add `tags: string[]` field to `products` documents (default `[]`)
- No new collection needed — tags reference existing `categories` doc IDs

### Tasks
- [ ] `admin/Marketplace.tsx` — product create/edit form:
      - Keep primary category dropdown (existing)
      - Add multi-select tag picker below it showing all other categories
      - Selected tags shown as removable chips
      - Save `tags: []` array alongside `categoryId` to Firestore
- [ ] `admin/Marketplace.tsx` — product list view:
      - Show tag chips on each product card in the admin list
- [ ] `src/pages/public/Store.tsx` — update filter logic:
      - Category filter: match if `categoryId == selected` OR `tags includes selected`
      - Search: also search tag names (resolve IDs to names for display)
- [ ] `src/pages/user/Marketplace.tsx` — apply same tag-aware filter logic
- [ ] `src/pages/LandingPage.tsx` — featured products already use snapshot,
      no filter change needed here
- [ ] Update Firestore rules: `tags` field writeable by admin, readable by all

---

## Phase 7 — Visitor Chat Widget
**Goal:** Any visitor on the public store or landing page can open a chat
and message support directly — no login required.
**Effort:** 1–2 sessions.
**Impact:** Converts browsing visitors into paying clients. Admin sees
visitor messages alongside regular user support chats.

### How It Works
- A floating button sits in the bottom-right corner of every public page
- It shows the **platform logo in a circle** with a **glowing green ring**
  when at least one admin is online, or a **glowing red ring** when no admin
  is currently active
- Clicking it opens a slide-up chat panel
- The visitor is identified by their existing `dt_vid` visitor ID
  (already stored in localStorage by `visitorCart.ts`)
- Visitor messages are stored in `visitor_conversations` Firestore collection
- Admins see visitor chats in a new "Visitor Chats" tab inside `/admin/chats`
- Visitor can optionally enter their name/email at the start of the chat;
  if they don't, they appear as "Visitor #xxxxx"

### New Firestore Collections
```
visitor_conversations/{visitorId}
  visitorId: string
  visitorName: string (optional, entered by visitor)
  visitorEmail: string (optional)
  status: 'open' | 'closed'
  unreadByAdmin: number
  lastMessage: string
  lastMessageAt: timestamp
  createdAt: timestamp

visitor_messages/{autoId}
  conversationId: string (visitorId)
  text: string
  sender: 'visitor' | 'admin'
  senderName: string
  createdAt: timestamp
  read: boolean
```

### Admin Online Presence
- When an admin opens any page, write `presence/{uid} { online: true, lastSeen: now }`
  to Firestore (updated every 60s, cleared on sign-out or browser close via
  `onDisconnect` — note: requires Realtime Database OR a Firestore timestamp
  check: "online if lastSeen < 2 min ago")
- Widget reads presence collection to determine green vs red glow
- Use Firestore for simplicity (no Realtime Database cost); poll every 60s

### Widget Visual Spec
- Fixed position: `bottom-6 right-6` on all public pages
- Circle button: 56px diameter, platform logo centered inside
- Outer ring: animated pulse — **green** (`#22c55e`) when admin online,
  **red** (`#ef4444`) when no admin online
- On click: slide-up panel (full screen on mobile, 380px wide panel on desktop)
- Panel header: platform logo + "Support Chat" + close button
- If no prior conversation: show name/email optional form + "Start Chat" button
- After starting: standard chat UI (text input, send button, message bubbles)
- Unread badge on the circle button (red dot) when admin replies while panel is closed

### Tasks
- [ ] Create `src/lib/visitorChatService.ts` — CRUD for visitor_conversations
      and visitor_messages, admin presence check
- [ ] Create `src/components/widget/SupportWidget.tsx` — floating button +
      slide panel + chat UI
- [ ] Create `src/lib/adminPresence.ts` — write/read admin presence in Firestore
- [ ] Add `<SupportWidget />` to `src/pages/LandingPage.tsx` and
      `src/pages/public/Store.tsx`
- [ ] Add "Visitor Chats" tab to `src/pages/admin/Chats.tsx`:
      - List of open visitor conversations with unread count badges
      - Click to open conversation and reply
      - "Close conversation" button
- [ ] Add Firestore rules for `visitor_conversations`, `visitor_messages`,
      `presence` collections
- [ ] Admin presence: write to Firestore on admin page load, update every 60s

---

## Phase 8 — Platform Notification Bot (Super Admin)
**Goal:** You (the platform owner) get a Telegram notification the moment
something important happens — new user signs up, visitor starts chatting,
or a support message goes unread.
**Effort:** 1 session. All client-side, no backend needed.
**Impact:** You never miss a lead or a client needing help, even when you're
away from the platform. Works on the Spark (free) Firebase plan.

### How It Is Different From User Bot Service
- **User BotService** (Phase 9) = users set up their own Telegram bot for
  their own projects
- **Platform Notification Bot** (this phase) = YOU set up one bot for the
  entire platform to alert you and your admins

### How It Works (Serverless)
The Telegram Bot API accepts HTTP POST requests from any origin — including
the browser. The bot token is stored in `platform_settings/bot_config` in
Firestore (super admin write only). When a trigger event fires client-side
(new signup, new message, unread timeout), the platform calls
`https://api.telegram.org/bot{TOKEN}/sendMessage` directly from the browser.

```
Trigger events → client-side Firebase listener → fetch Telegram API
```

No backend. No Cloud Functions needed.

### Trigger Events
| Event | Trigger | Message Sent |
|---|---|---|
| New user registered | `users` collection — new doc | "👤 New user signed up: {username} ({email})" |
| New visitor chat | `visitor_conversations` — new doc | "💬 New visitor started a chat" |
| Support message unread >10 min | Check `conversations` unread count | "🔔 Unread message from {username} — {preview}" |
| Visitor message unread >10 min | Check `visitor_conversations` unread | "👁 Unread visitor message — {preview}" |
| Admin comes online | presence update | (no notification — not needed) |

### Unread Message Logic (Serverless Approach)
Because there's no backend cron, unread detection works like this:
- When a message is sent (user or visitor), store `lastMessageAt` timestamp
- Any admin who has the platform open runs a local interval check every 5 min
- If `lastMessageAt` is >10 min ago AND `unreadByAdmin > 0` → send bot alert
- A `botAlertSent` flag on the conversation prevents duplicate alerts

### Super Admin Settings UI
Add a new "Platform Bot" card to `src/pages/superadmin/PlatformSettings.tsx`:
- Bot Token field (password-masked input)
- Chat ID field (your personal Telegram chat ID or group ID)
- "Test Bot" button — sends a test message immediately
- Toggle: enable/disable each event type individually
- Save to `platform_settings/bot_config` (super admin only, Firestore rules)

### Tasks
- [ ] Add "Platform Bot" section to `src/pages/superadmin/PlatformSettings.tsx`
- [ ] Create `src/lib/platformBotService.ts`:
      - `sendBotMessage(token, chatId, text)` — calls Telegram API
      - `checkAndAlertUnread()` — runs the unread check logic
      - `triggerBotEvent(eventType, data)` — central dispatcher
- [ ] Wire new user signup trigger in `src/AuthContext.tsx` register function
- [ ] Wire new visitor chat trigger in `src/lib/visitorChatService.ts`
      (created in Phase 7)
- [ ] Wire unread message check interval in admin pages
      (`/admin/chats` mounts → starts interval → clears on unmount)
- [ ] Add Firestore rule: `platform_settings/bot_config` readable and
      writable only by super admin
- [ ] "Test Bot" button in settings sends: "✅ Platform Bot connected successfully"

---

## Phase 9 — User Bot Service Execution
**Goal:** Make the user's own Telegram bot actually send messages.
**Effort:** Requires Cloudflare Workers (free tier) or similar.
**Note:** Hold until revenue is stable. Config UI already built.
**Blocker:** Unlike the Platform Bot, user bots need to run server-side
webhooks to respond to incoming messages. Use Cloudflare Workers free tier
(100k requests/day free) when ready.

### Tasks
- [ ] Deploy a Cloudflare Worker as the Telegram webhook endpoint
- [ ] Worker reads bot config from Firestore (using Firebase REST API)
- [ ] Worker handles incoming Telegram messages, posts reply back via Bot API
- [ ] Wire worker URL as webhook in `src/pages/user/BotService.tsx`
- [ ] Test end-to-end with a real Telegram token

---

## QUICK REFERENCE — What Works Right Now

| Feature | Status |
|---|---|
| Signup / Login / Logout | ✅ Working |
| Vault staff gate + PIN | ✅ Working |
| User dashboard (real data) | ✅ Working (terminology needs fix) |
| Admin dashboard (real data) | ✅ Working (terminology needs fix) |
| Real-time chat (user ↔ admin) | ✅ Working |
| Public store + visitor cart | ✅ Working |
| Marketplace + checkout | ✅ Working |
| Orders + receipts | ✅ Working |
| Receipt public verification | ✅ Working |
| Wallet (balance + history) | ✅ Working (proof upload is fake) |
| Admin approve/reject payments | ✅ Working (proof viewer broken) |
| Notifications | ✅ Working |
| Projects (user + admin) | ✅ Working |
| Subscription purchase | ✅ Working (bad labels) |
| Coupons + Referrals | ✅ Working |
| Email (EmailJS only) | ✅ Working |
| Invoice PDF generation | ✅ Working |
| Platform settings | ✅ Working |
| Audit logs | ✅ Working |
| Sessions (view/revoke) | ✅ Working |
| Admin Issues page | ❌ Completely fake |
| Wallet proof upload | ❌ Saves fake image |
| Profile photo | ❌ Shows placeholder |
| Profile edit buttons | ❌ Dead (no onClick) |
| Product multi-category tags | ❌ Not built |
| Visitor chat widget | ❌ Not built |
| Platform notification bot | ❌ Not built |
| User Bot Service execution | ❌ Config only |

---

## COST NOTES (Serverless / Free Tier)

| Service | Free Limit | Notes |
|---|---|---|
| Firebase Spark (Firestore) | 50k reads / 20k writes per day | Fine for <100 users |
| Cloudinary | 25 credits/month | Fine for early file uploads |
| EmailJS | 200 emails/month | Fine for early stage |
| Telegram Bot API | Unlimited | Free forever |
| Cloudflare Workers | 100k requests/day | For Phase 9 user bots only |
| Netlify / Replit hosting | Free | ✅ |

**Upgrade trigger:** Move to Firebase Blaze only if you need scheduled
Cloud Functions. Everything in Phases 1–8 runs 100% on the free Spark plan.
