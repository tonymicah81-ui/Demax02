# Durex Team Platform — Build Plan

> Full audit completed June 2026. This document covers every known issue,
> bad piece of terminology, fake/hardcoded data, and missing feature found
> across the codebase. Organized into phases from quickest to most complex.
> Execute phases in order — Phase 1 unblocks everything else.

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
- [ ] `Login.tsx` — proper logo, spacing, touch targets on mobile
- [ ] `Signup.tsx` — stack fields vertically, proper spacing on small screens
- [ ] `VaultLogin.tsx` — match Login mobile treatment
- [ ] `VaultSignup.tsx` — match Signup mobile treatment
- [ ] `StaffLogin.tsx` — match Login mobile treatment

### Dashboard Mobile Pass
- [ ] User Dashboard — fix stat cards stacking, chart overflow on mobile
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

## Phase 6 — Bot Service (When Ready)
**Goal:** Make the Telegram bot actually send messages.
**Effort:** Requires a small backend endpoint OR a Firebase Cloud Function.
**Note:** Skip until revenue is stable. The config UI is already built.
**Blocker:** Needs either Firebase Cloud Functions (Blaze plan, $0 while under limits)
or a free serverless function host (Cloudflare Workers free tier).

### Tasks
- [ ] Decide on serverless platform (Firebase Functions or Cloudflare Workers)
- [ ] Write function: read bot subscription from Firestore, send message via Telegram Bot API
- [ ] Wire function trigger to new order / project update events
- [ ] Test with real Telegram token + chatId

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
| Bot Service | ❌ Config only, no execution |

---

## COST NOTES (Serverless / Free Tier)

| Service | Free Limit | Your Usage Estimate |
|---|---|---|
| Firebase Spark (Firestore) | 50k reads / 20k writes per day | Fine for <100 users |
| Cloudinary | 25 credits/month | Fine for early file uploads |
| EmailJS | 200 emails/month | Fine for early stage |
| Netlify / Replit hosting | Free | ✅ |
| Telegram Bot API | Free | ✅ (when built) |

**Upgrade trigger:** Move to Firebase Blaze (pay-as-you-go) only when you need
Cloud Functions for the bot or when you hit Spark read/write limits.
Blaze has no minimum — you pay only what you use beyond free tier.
