# Durex Team Platform — Build Plan

> Full audit completed June 2026. This document covers every known issue,
> bad terminology, fake/hardcoded data, missing feature, and new feature
> to be built. Organized into phases from quickest-win to most complex.
> Execute phases in order — earlier phases unblock later ones.

---

## AUDIT SUMMARY

### Auth Pages — Mobile Responsiveness
All five auth pages use `max-w-md w-full` and `p-4` — technically responsive
classes — but the visual layout has no real mobile-first treatment: no logo
stacking, no proper touch-target sizing, no adjusted font scales, no comfortable
vertical spacing between fields on small screens.

---

### Bad Terminology Found (Full List)

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
| `"Protocol DT-X"` | Remove label |
| `placeholder="SPECIFY_ANOMALY..."` | `placeholder="Describe your issue..."` |
| `"PROPOSE RESTORATION_"` | `"Submit Request"` |
| `"Professional Expansion"` / `"functional empire"` | Real CTA copy or remove |
| `"Operational Efficiency +12%"` | Remove (hardcoded fake) |
| `"NO_DOMAIN_ALLOCATED"` | `"No domain assigned"` |

#### Admin Dashboard (`src/pages/admin/Dashboard.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Auth_Middleware::Active"` | Remove or `"Authentication Active"` |
| `"Firestore_Grip::Enabled"` | Remove or `"Database Connected"` |
| `"Sessions::Tracked"` | Remove or `"Sessions Active"` |
| `"Optimal"` (hardcoded health) | Remove widget entirely |
| `88.4%` progress bar | Remove (completely fake) |
| `"Admin Action"` on audit logs | Use actual log action type |
| `"All Systems Online"` | Remove |

#### Super Admin Dashboard (`src/pages/superadmin/Dashboard.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Core_Stabilized::Full_Access"` | Remove |
| `"COMMIT_SYNC_PARAMS"` | `"Save Bank Details"` |
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
| `"STATUS: LIQUID_READY"` | Remove |
| `"DATA_P"` | Remove |

#### Profile Page (`src/pages/user/Profile.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `"Verified Engine"` | `"Verified"` |
| `"All protocols green"` | `"Account in good standing"` |
| `IP_ADDR: 192.XXX.XX.XX` | Remove entirely |
| `DEVICE: DESKTOP_PROTOCOL_OS` | Remove entirely |

#### Chat List (`src/components/chat/ChatList.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `placeholder="SEARCH_IDENTITY..."` | `placeholder="Search conversations..."` |
| `"Unknown Entity"` (fallback name) | `"Unknown User"` |

#### Payments Page (`src/pages/admin/Payments.tsx`)
| Current (Bad) | Replace With |
|---|---|
| `94.2%` success rate | Remove |
| `"Volume Growing"` | Remove |

---

### Hardcoded Fake Data

| File | Issue | Fix |
|---|---|---|
| `user/Wallet.tsx` | Proof image = picsum URL | Real Cloudinary upload |
| `user/Profile.tsx` | Profile photo = picsum | Real Cloudinary upload |
| `admin/Issues.tsx` | Entire page is a JS array | Connect to Firestore |
| `admin/Dashboard.tsx` | Health bar = `88.4%` | Remove widget |
| `admin/Payments.tsx` | Success rate = `94.2%` | Remove stat |
| `user/Dashboard.tsx` | `+12%` efficiency | Remove stat |

---

### Incomplete / Broken Features

| Feature | File | What's Missing |
|---|---|---|
| Wallet proof upload | `user/Wallet.tsx` | Real Cloudinary upload |
| Profile photo | `user/Profile.tsx` | Real Cloudinary upload |
| Profile edit buttons | `user/Profile.tsx` | No onClick handler |
| Admin Issues page | `admin/Issues.tsx` | Entirely fake |
| Fixes — Notify User | `admin/Fixes.tsx` | No notification sent |
| Subscription alerts | `user/Subscription.tsx` | Native `alert()` |
| CRM / KB delete | `admin/CRM.tsx`, `KnowledgeBase.tsx` | Native `confirm()` |
| Product categories | `admin/Marketplace.tsx` | Single category only |
| Bot execution | `user/BotService.tsx` | Config only |

---

## PHASES

---

## Phase 1 — Terminology & Fake Data Cleanup
**Goal:** Professional labels everywhere. No robot-speak. No fake numbers.
**Effort:** 1–2 sessions. Zero new features.
**Impact:** Immediate — every client and visitor sees clean, clear language.

- [ ] Fix all bad terminology in User Dashboard
- [ ] Fix all bad terminology in Admin Dashboard
- [ ] Fix all bad terminology in Super Admin Dashboard
- [ ] Fix Subscription page labels + replace native `alert()`
- [ ] Fix Broadcast page labels
- [ ] Fix Wallet page labels
- [ ] Fix Profile page — remove fake IP, device, status labels
- [ ] Fix Chat list search bar label + "Unknown Entity" fallback
- [ ] Remove hardcoded fake metrics (88.4%, 94.2%, +12%)
- [ ] Fix Super Admin bank details placeholders
- [ ] Replace native `confirm()` in CRM and KnowledgeBase with inline modals

---

## Phase 2 — Mobile Design Pass
**Goal:** Every auth page and key dashboard looks right on a phone.
**Effort:** 1 session.

- [ ] `Login.tsx` — logo stack, large touch targets, comfortable spacing
- [ ] `Signup.tsx` — single column on mobile, larger field height
- [ ] `VaultLogin.tsx` — match Login treatment
- [ ] `VaultSignup.tsx` — match Signup treatment
- [ ] `StaffLogin.tsx` — match Login treatment
- [ ] User Dashboard — stat cards stack properly, no chart overflow
- [ ] Admin Dashboard — table overflow handled, card grid collapses
- [ ] Super Admin Dashboard — form layout works on small screens

---

## Phase 3 — Real File Uploads (Proof & Profile Photo)
**Goal:** Replace fake picsum images with real Cloudinary uploads.
**Effort:** 1 session.

- [ ] `user/Wallet.tsx` — wire image picker to `uploadToCloudinary()`,
      save real `secure_url` to Firestore
- [ ] `user/Profile.tsx` — add profile photo upload, save URL to `users/{uid}`
- [ ] Wire "Modify Identification" button to open profile edit modal
      (username + phone, `updateDoc` + audit log)
- [ ] `admin/Payments.tsx` — proof viewer shows real Cloudinary image

---

## Phase 4 — Admin Issues Page (Full Rebuild)
**Goal:** Replace 100% hardcoded page with real Firestore-backed tracker.
**Effort:** 1 session.

- [ ] `issues` Firestore collection fields: `userId`, `title`, `description`,
      `status` (open/in_progress/resolved), `priority` (low/medium/high),
      `createdAt`, `updatedAt`, `adminNote`
- [ ] Rebuild `admin/Issues.tsx`:
      real-time listener, status filter tabs, search, slide panel detail view,
      "Mark Resolved" / "Mark In Progress" updates Firestore
- [ ] Connect User Dashboard Fix Request form to `issues` collection
- [ ] Wire "Notify User" in `admin/Fixes.tsx` to create `user_notifications` doc

---

## Phase 5 — Profile Edit Modal
**Goal:** Users can update username and phone without contacting admin.
**Effort:** Half a session.

- [ ] Build inline edit modal (username + phone fields)
- [ ] `updateDoc(users/{uid}, { username, phoneNumber })` on save
- [ ] Log change to `audit_logs`
- [ ] Wire "Modify Identification" button to open modal

---

## Phase 6 — Multi-Category Product Tagging
**Goal:** One product can appear in multiple category searches.
**Effort:** 1 session.
**Impact:** A product tagged as both "E-Commerce" and "Logistics" shows up
when a visitor filters either — more visibility, more sales.

### Design
- Keep existing `categoryId` as the **primary category** (unchanged)
- Add new `tags: string[]` field — array of additional category IDs
- Search and filter match if primary OR any tag matches

### Tasks
- [ ] `admin/Marketplace.tsx` product form — add multi-select tag picker
      below primary category; selected tags shown as removable chips;
      save `tags: []` array to Firestore alongside `categoryId`
- [ ] `admin/Marketplace.tsx` product list — show tag chips per product card
- [ ] `src/pages/public/Store.tsx` — update filter: match `categoryId` OR
      any value in `tags[]`; show tag names in filter results
- [ ] `src/pages/user/Marketplace.tsx` — same tag-aware filter logic
- [ ] Firestore rules: `products` write already covered by `isAdmin()`

---

## Phase 7 — Visitor Chat Widget
**Goal:** Any visitor on the landing page or store can start a live chat
with support — no account needed.
**Effort:** 1–2 sessions.
**Impact:** Turns browsers into conversations, conversations into clients.

### Widget Design
- **Fixed position:** `bottom-6 right-6` on all public pages
- **Button:** 56px circle, platform logo centered inside
- **Outer ring:** animated pulse glow — **green** when admin online,
  **red** when no admin is active (reads from `presence` collection)
- **Unread badge:** red dot on button when admin replies and panel is closed
- **On click:** slide-up panel — full screen mobile, 380px desktop
- **Panel header:** platform logo + "Support Chat" + close button
- First open: optional name/email form → "Start Chat" button
- After start: standard chat UI (message bubbles, text input, send)

### New Collections
```
visitor_conversations/{visitorId}
  visitorId, visitorName, visitorEmail, status, unreadByAdmin,
  lastMessage, lastMessageAt, createdAt, botAlertSent

visitor_messages/{autoId}
  conversationId, text, sender ('visitor'|'admin'), senderName,
  createdAt, read, readAt
```

### Admin Presence
- On admin page load: write `presence/{uid} { online: true, lastSeen: now }`
- Update every 60s while page is open
- Widget checks: any presence doc with `lastSeen < 2 min ago` → green
- Firestore rule: public read, admin-only write (already in rules)

### Tasks
- [ ] `src/lib/visitorChatService.ts` — CRUD for visitor_conversations
      and visitor_messages, unread tracking
- [ ] `src/lib/adminPresence.ts` — write/read admin online status
- [ ] `src/components/widget/SupportWidget.tsx` — full widget component:
      floating button, glow ring, slide panel, chat UI
- [ ] Add `<SupportWidget />` to `LandingPage.tsx` and `Store.tsx`
- [ ] `src/pages/admin/Chats.tsx` — add "Visitor Chats" tab:
      list of open visitor conversations with unread badges,
      click to open and reply, "Close Conversation" button
- [ ] Admin presence: write to Firestore on admin page mount, every 60s interval
- [ ] Firestore rules: visitor_conversations, visitor_messages, presence
      (already added to firestore.rules)

---

## Phase 8 — Platform Notification Bot (Super Admin)
**Goal:** You get a Telegram alert the moment something important happens.
**Effort:** 1 session. 100% client-side, no backend, works on free Firebase plan.

### How It's Different From User Bot Service
- **This phase** = the platform owner's alert system (your Telegram)
- **Phase 9** = each user's own Telegram bot for their own projects

### How It Works
Telegram Bot API accepts browser HTTP calls. Bot token stored in
`platform_settings/bot_config` (super admin only). Triggers fire
client-side from Firebase listeners → `fetch` to Telegram API.

### Trigger Events
| Event | When | Message |
|---|---|---|
| New user signed up | `users` collection — new doc | "👤 New user: {username} ({email})" |
| New visitor chat started | `visitor_conversations` — new doc | "💬 New visitor chat started" |
| Support message unread >10 min | Interval check on admin pages | "🔔 Unread from {username}: {preview}" |
| Visitor message unread >10 min | Interval check | "👁 Unread visitor message: {preview}" |

### Unread Detection (Serverless)
- Message sent → store `lastMessageAt` timestamp + `unreadByAdmin` count
- Any admin with the platform open runs a 5-min interval check
- If `lastMessageAt` is >10 min old AND `unreadByAdmin > 0` → send alert
- `botAlertSent: true` flag on conversation → no duplicate alerts

### Super Admin UI
Add "Platform Bot" card to `src/pages/superadmin/PlatformSettings.tsx`:
- Bot Token field (password-masked)
- Chat ID field (your Telegram chat ID)
- "Test Bot" button → sends test message immediately
- Toggle each event type on/off individually

### Tasks
- [ ] "Platform Bot" section in `src/pages/superadmin/PlatformSettings.tsx`
- [ ] `src/lib/platformBotService.ts`:
      `sendBotMessage(token, chatId, text)`,
      `checkAndAlertUnread()`,
      `triggerBotEvent(eventType, data)`
- [ ] Wire new user signup trigger in `AuthContext.tsx` register function
- [ ] Wire new visitor chat trigger in `visitorChatService.ts`
- [ ] Wire unread check interval in `/admin/chats` (mount → start, unmount → clear)
- [ ] Firestore rule: `platform_settings/bot_config` already super-admin-only

---

## Phase 9 — User Bot Service Execution
**Goal:** Each user's own Telegram bot actually runs and responds.
**Effort:** Needs Cloudflare Workers (free tier: 100k req/day).
**Note:** Hold until revenue is stable. Config UI already built.

- [ ] Deploy Cloudflare Worker as Telegram webhook endpoint
- [ ] Worker reads bot config from Firestore via Firebase REST API
- [ ] Worker handles incoming messages, sends reply via Bot API
- [ ] Wire webhook URL into `src/pages/user/BotService.tsx`
- [ ] End-to-end test with real token + chat ID

---

## Phase 10 — User Client Notepad (Admin)
**Goal:** Any admin or worker can leave private notes on a client's profile.
Notes survive between shifts so any team member can pick up exactly where
another left off — no client has to repeat themselves.
**Effort:** 1 session.
**Impact:** Professional client management. Huge trust signal for agency work.

### How It Works
- New "Notes" tab added to `src/pages/admin/UserDetails.tsx` (becomes 8th tab)
- Each note shows: text body, author name, timestamp, edit/delete buttons
- Any admin can add a note. Only the note author (or super admin) can delete it.
- Notes saved to subcollection: `user_notes/{userId}/notes/{noteId}`
- Fields: `text`, `authorId`, `authorName`, `createdAt`, `updatedAt`

### Use Cases
- "Client wants green color scheme — do not change"
- "Website: durexclient.com — expires June 2027"
- "Had billing dispute on 12 May — resolved, client happy now"
- "Needs invoice every month end"

### Tasks
- [ ] `src/components/admin/UserNotepad.tsx` — note list + add/edit/delete UI
- [ ] Add "Notes" tab to `UserDetails.tsx` with `<UserNotepad userId={userId} />`
- [ ] `src/lib/noteService.ts` — CRUD for `user_notes/{userId}/notes`
- [ ] Firestore rules: `user_notes` (already added to firestore.rules)
- [ ] Show note count badge on the Notes tab if notes exist

---

## Phase 11 — Enhanced Visitor Intelligence
**Goal:** When a visitor opens the widget or browses the store, you know
more than just that they visited — you know where they came from, what
device they're on, what they looked at, and if they've been before.
**Effort:** 1 session. Uses free IP geolocation API (no key needed).
**Impact:** Helps you understand your audience and qualify leads faster.

### What Gets Captured (Automatically, Silently)
| Data Point | How | Source |
|---|---|---|
| Country + City | `ip-api.com/json` (free, no key) | IP geolocation |
| Device type | `navigator.userAgent` parse | Browser |
| Browser | `navigator.userAgent` parse | Browser |
| Referrer | `document.referrer` | Browser |
| Pages visited | Array updated on each page view | Client-side |
| First vs returning | Check if `dt_vid` already in `visitor_intelligence` | Firestore |
| Total visits | Increment on each session | Firestore |
| Last seen | Updated on each page view | Firestore |

### Firestore Collection
```
visitor_intelligence/{visitorId}
  visitorId, country, city, device ('mobile'|'tablet'|'desktop'),
  browser, referrer, pagesVisited[], firstSeen, lastSeen,
  totalVisits, isReturning
```

### Admin View
- Show enriched visitor card in the "Visitor Chats" tab (Phase 7):
  country flag + city, device icon, browser, referrer, pages visited list
- Helps admin immediately know: "This is a mobile user from Lagos
  who came from Instagram and looked at the e-commerce product twice"

### Tasks
- [ ] `src/lib/visitorIntelligence.ts`:
      `initVisitorIntelligence()` — call on public page mount,
      fetches geo, parses UA, reads/creates Firestore doc,
      updates `pagesVisited` and `lastSeen`
- [ ] Call `initVisitorIntelligence()` in `LandingPage.tsx` and `Store.tsx`
- [ ] `src/components/admin/VisitorCard.tsx` — enriched display component
      (flag, device icon, browser, referrer, pages list)
- [ ] Show `<VisitorCard />` in Visitor Chats tab when a conversation is selected
- [ ] Firestore rules: `visitor_intelligence` (already added to firestore.rules)

---

## Phase 12 — Admin Chat Power Features
**Goal:** Give admins and workers proper tools to handle client chats fast,
professionally, and without confusion about who is handling what.
**Effort:** 1–2 sessions.
**Impact:** Faster responses = happier clients = better retention.

### Feature 1 — Chat Assignment
Assign a specific admin/worker to a conversation. Other workers see
"Assigned to: John" and know not to double-handle. Prevents two workers
replying to the same client at the same time.

- `chat_assignments/{convId}` Firestore collection (already in rules)
- Fields: `assignedTo` (uid), `assignedToName`, `assignedBy`, `assignedAt`
- Show assignee name + avatar in `ChatList` sidebar per conversation
- "Assign to me" / "Reassign" button in `ChatHeader`
- Filter in chat list: "My Chats" / "Unassigned" / "All"

### Feature 2 — Quick Reply Templates
Admin saves common responses (e.g., "We'll update your project within 24
hours") and picks from a pop-up list in the chat input area. Saves time on
repetitive answers.

- `quick_replies` Firestore collection (already in rules)
- Fields: `title`, `body`, `createdBy`, `createdAt`
- Lightning bolt icon in `ChatInput` opens template picker popup
- Click a template → inserts text into input (editable before sending)
- Admin can add/edit/delete templates from the chat interface

### Feature 3 — Admin-Initiated Chat
Admin can start a conversation with any user directly from the Users list
or UserDetails page — without waiting for the user to message first.

- "Start Chat" button on `admin/Users.tsx` row actions
- "Message User" button on `admin/UserDetails.tsx` Overview tab
- Creates conversation doc in `conversations` (if not exists) then
  navigates to `/admin/chats` with that conversation pre-selected

### Feature 4 — Offline Lead Capture (Widget Enhancement)
When widget ring is red (no admin online), instead of just a chat box,
show a "Leave a message" form. On submit, creates a CRM lead entry so
no visitor inquiry is ever lost.

- Widget detects red state → swap chat panel for contact form
  (name, email, message fields)
- Submit → `addDoc(leads, { name, email, message, source: 'widget', ... })`
- Admin sees it in `/admin/crm` as a new lead with source "Widget"

### Tasks
- [ ] `chat_assignments` CRUD in `chatService.ts`
- [ ] Assignment display in `ChatList.tsx` sidebar
- [ ] "Assign to me" / "Reassign" button in `ChatHeader.tsx`
- [ ] "My Chats" / "Unassigned" / "All" filter tabs in chat list
- [ ] `quick_replies` CRUD — add/edit/delete panel in admin chat sidebar
- [ ] Lightning bolt button in `ChatInput.tsx` opens template picker
- [ ] "Start Chat" on `admin/Users.tsx` row
- [ ] "Message User" on `admin/UserDetails.tsx` Overview tab
- [ ] Offline lead capture form in `SupportWidget.tsx`
- [ ] Firestore rules: `chat_assignments`, `quick_replies` (already in rules)

---

## QUICK REFERENCE — Full Feature Status

| Feature | Status |
|---|---|
| Signup / Login / Logout | ✅ Working |
| Vault staff gate + PIN | ✅ Working |
| User dashboard (real data) | ✅ Working (terminology fix in Phase 1) |
| Admin dashboard (real data) | ✅ Working (terminology fix in Phase 1) |
| Real-time chat (user ↔ admin) | ✅ Working |
| Public store + visitor cart | ✅ Working |
| Marketplace + checkout | ✅ Working |
| Orders + receipts | ✅ Working |
| Receipt public verification | ✅ Working |
| Wallet (balance + history) | ✅ Working (proof upload fake → Phase 3) |
| Admin approve/reject payments | ✅ Working (proof viewer broken → Phase 3) |
| Notifications | ✅ Working |
| Projects (user + admin) | ✅ Working |
| Subscription purchase | ✅ Working (bad labels → Phase 1) |
| Coupons + Referrals | ✅ Working |
| Email (EmailJS only) | ✅ Working |
| Invoice PDF generation | ✅ Working |
| Platform settings | ✅ Working |
| Audit logs | ✅ Working |
| Sessions (view/revoke) | ✅ Working |
| Admin Issues page | ❌ Completely fake → Phase 4 |
| Wallet proof upload | ❌ Fake image → Phase 3 |
| Profile photo | ❌ Placeholder → Phase 3 |
| Profile edit buttons | ❌ Dead → Phase 5 |
| Product multi-category tags | ❌ Not built → Phase 6 |
| Visitor chat widget | ❌ Not built → Phase 7 |
| Platform notification bot | ❌ Not built → Phase 8 |
| User client notepad | ❌ Not built → Phase 10 |
| Visitor intelligence | ❌ Not built → Phase 11 |
| Chat assignment | ❌ Not built → Phase 12 |
| Quick reply templates | ❌ Not built → Phase 12 |
| Admin-initiated chat | ❌ Not built → Phase 12 |
| User Bot Service execution | ❌ Config only → Phase 9 |

---

## COST NOTES (Serverless / Free Tier)

| Service | Free Limit | Status |
|---|---|---|
| Firebase Spark (Firestore) | 50k reads / 20k writes per day | ✅ Fine for <200 users |
| Cloudinary | 25 credits/month | ✅ Fine for early uploads |
| EmailJS | 200 emails/month | ✅ Fine for early stage |
| Telegram Bot API | Unlimited | ✅ Free forever |
| ip-api.com (geo) | 45 req/min | ✅ Free, no key needed |
| Cloudflare Workers | 100k requests/day | ✅ Free (Phase 9 only) |
| Netlify / Replit | Free tier | ✅ |

**Phases 1–12 all run on the free Firebase Spark plan.**
Only upgrade to Blaze if you need scheduled Cloud Functions later.
