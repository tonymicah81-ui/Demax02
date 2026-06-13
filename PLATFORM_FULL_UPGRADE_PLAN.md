# Durex Team Platform — Full Upgrade Plan

**Created:** June 13, 2026  
**Scope:** All remaining pages, terminology cleanup, dynamic data connections, and new feature suggestions  
**Execution Order:** Phases 1 → 9, each phase is self-contained and can be executed independently.

---

## Summary of What Has Been Completed

| Area | Status |
|---|---|
| LandingPage.tsx — full rebuild | ✅ Done |
| PublicLayout.tsx — mobile menu | ✅ Done |
| Store.tsx — mobile filters + animations | ✅ Done |
| TermsAndConditions.tsx — full rebuild | ✅ Done |

---

## What Still Needs Work

The rest of the platform — approximately **30+ pages** — has been flagged across three problem categories:

1. **Jargon / Bad Terminology** — Internal developer slang exposed to end users (`Fiscal Terminal`, `Entity Registry`, `Anomaly Logs`, `DEPLOY_ASSET_MODULE`, `Construct_Product`, `UNKNOWN_PROTO`, etc.)
2. **Dynamic Data Not Connected** — Landing page subscription prices are hardcoded; support email is already live but prices don't reflect what superadmin sets
3. **Unworked Pages** — Pages that have never been visually upgraded and are still in raw state

---

## Phase 1 — Marketplace Terminology Cleanup

### 1A. User Marketplace (`src/pages/user/Marketplace.tsx`)

| Current | Fix |
|---|---|
| Title: `Marketplace_X` | `Asset Marketplace` |
| Subtitle: `Durex Engine Marketplace // Asset Catalog v2.0` | `Browse and purchase ready-made digital assets` |
| Button: `CART_CHECKOUT` | `View Cart` |
| Search: `SEARCH_PRODUCTS...` | `Search products...` |
| Loading: `Loading_Storefront` | `Loading products...` |
| `alert()` on add to cart | Replace with inline toast / button animation (no browser popup) |
| Card footer: `UID: {id.slice(0,8)}` | Remove — shows internal DB IDs to users |
| `CheckCircle2` icon in footer (no context) | Replace with category badge |
| No action visible on mobile (hover-only) | Add "Add to Cart" button below card content, always visible |
| Empty state: just an icon with opacity | Proper empty state card like Store.tsx |

### 1B. Admin Marketplace (`src/pages/admin/Marketplace.tsx`)

| Current | Fix |
|---|---|
| Title: `Market_Control` | `Marketplace Management` |
| Subtitle: `Asset Inventory Management // Durex Protocol v2.1` | `Manage products, categories, and subscription plans` |
| Tab label: `Taxonomy` | `Categories` |
| Tab label: `Catalog` | `Products` |
| Card title: `Sub-Taxonomy` | `Subcategories` |
| Button: `ADD_CAT` | `Add Category` |
| Button: `ADD_SUB` | `Add Subcategory` |
| Search placeholder: `ID_TRACER...` | `Search products...` |
| Button: `CREATE_MODEL` | `Add Plan` |
| Card title: `Product Registry` | `Products` |
| Modal: `Assemble_Category` | `New Category` |
| Modal: `Assemble_SubCategory` | `New Subcategory` |
| Modal: `Construct_Product` | `New Product` |
| Modal: `Initialize_Subscription_Model` | `New Subscription Plan` |
| Submit button: `DEPLOY_ASSET_MODULE` | `Save` |
| Parent fallback: `UNKNOWN_PROTO` | `Uncategorized` |
| Delete confirm: `"This protocol is irreversible"` | `"This action cannot be undone."` |
| Tab: `Subscriptions` with `CREATE_MODEL` | Rename to `Plans`, add better empty state |

**Effort:** Medium — two files, JSX text changes + minor UX improvements  
**Files:** `src/pages/user/Marketplace.tsx`, `src/pages/admin/Marketplace.tsx`

---

## Phase 2 — Dynamic Data Connections

### 2A. Landing Page — Subscription Prices from Firestore

**Problem:** The three plan cards on the landing page (`Email Basic $15`, `Email Pro $30`, `Telegram Bot $20`) are hardcoded in `PLANS` array.

**What the SuperAdmin already has:**
- `platform_settings/bot_config` → `tiers` array with `{ name, price, features }`
- `subscription_models` Firestore collection → created by admin via Marketplace Management

**Fix:**
- Query `subscription_models` collection on load
- If 3+ models exist, replace static PLANS with live data
- Fall back gracefully to the hardcoded PLANS if the collection is empty or fails
- Map `model.name`, `model.price`, `model.features` (array or comma string) into plan cards

**Files:** `src/pages/LandingPage.tsx`

### 2B. Support Email — Status Check

**Current state:** ✅ Already connected.
- `usePlatformSetting("general")` reads `supportEmail` from Firestore
- Falls back to `support@durax.com` if not set
- Footer on LandingPage uses this live value
- No change needed — leave `support@durax.com` as demo

### 2C. Platform Domain — Leave as-is

**Current state:** Domain not purchased yet.  
**Plan:** Once a domain is purchased, superadmin sets it in `platform_settings/general` as `platformDomain`. No code change needed now — leave this for when the domain exists.

### 2D. PlatformSettings — Add Subscription Price Fields

**Problem:** The SuperAdmin has bot tier pricing in `platform_settings/bot_config` but no dedicated place for email plan pricing.

**Fix:**
- Add a new `subscriptions` tab to PlatformSettings
- Fields: `emailBasicPrice`, `emailProPrice`, `botPrice` (monthly rates)
- Saves to `platform_settings/subscriptions` Firestore doc
- LandingPage reads from this doc first, falls back to `subscription_models`, then falls back to hardcoded values

**Files:** `src/pages/superadmin/PlatformSettings.tsx`, `src/lib/platformSettings.ts`, `src/pages/LandingPage.tsx`

---

## Phase 3 — Platform-wide Terminology Cleanup (All Pages with Jargon)

Based on a full audit, the following pages have developer jargon exposed to users or use non-professional internal language:

### 3A. Admin Pages

| Page | Bad Terminology | Fix |
|---|---|---|
| `admin/Dashboard.tsx` | "Admin HQ", "Active Nodes", "Unread Signals", "Operational Stream" | "Dashboard", "Active Users", "Unread Messages", "Recent Activity" |
| `admin/Users.tsx` | "Entity Registry", "Population Monitoring", "Designation", "Internal Status" | "Users", "User Management", "Role", "Status" |
| `admin/Payments.tsx` | "Fiscal_Review", "Awaiting_Nodes", "Protocol_Ledger", "AUTH" button | "Payments", "Pending", "Transaction Log", "Approve" |
| `admin/Issues.tsx` | "Anomaly Logs", "UNRESOLVED_FRAGMENT", "Identity Fragment Sync" | "Support Issues", "Open", "User Sync" |
| `admin/Fixes.tsx` | "Anomaly Restoration Dashboard", "Engine_Fixes", "RELAY_USER" | "Support Fixes", "Fixes", "Notify User" |
| `admin/Projects.tsx` | Status: `"email spam setup complete"`, `"smartsupp working"` (internal dev notes) | Replace with: `"Email configured"`, `"Live Chat active"`, `"In Review"`, `"Deployed"` |

### 3B. User Pages

| Page | Bad Terminology | Fix |
|---|---|---|
| `user/Wallet.tsx` | "Fiscal Terminal", "PROPOSE FISCAL TRANSFUSION" | "Wallet", "Request Payment" |
| `user/Subscription.tsx` | References "Fiscal Terminal" in alerts | Change to "Wallet" |
| `user/Projects.tsx` | "Operation Logs" for history, "OPTIMIZING" for status | "Project History", "In Progress" |
| `user/BotService.tsx` | "Neural Interface", "Syncing Synapses" | "Bot Settings", "Connecting..." |

**Effort:** Small per file — find & replace text strings, no logic changes  
**Files:** 10 files across admin/ and user/

---

## Phase 4 — User Core Pages (Visual Upgrade)

These pages are functional but have never been given a proper visual treatment matching the new design language.

### 4A. User Dashboard (`src/pages/user/Dashboard.tsx`)
- Stats overview cards: projects count, wallet balance, active subscriptions, unread messages
- Quick action buttons: Browse Store, View Projects, Check Wallet
- Recent activity feed
- Welcome greeting with user name

### 4B. User Cart (`src/pages/user/Cart.tsx`)
- Full checkout page redesign matching Store.tsx style
- Order summary panel
- Cart item list with quantity/remove
- Total + checkout CTA

### 4C. User Orders (`src/pages/user/Orders.tsx`)
- Order history table with status badges
- Receipt download link per order
- Empty state

### 4D. User Wallet (`src/pages/user/Wallet.tsx`)
- Remove jargon (Phase 3 covers text changes)
- Transaction history table
- Balance card with withdrawal/deposit CTAs
- Pending payments indicator

**Effort:** Medium (4 files)  
**Files:** `user/Dashboard.tsx`, `user/Cart.tsx`, `user/Orders.tsx`, `user/Wallet.tsx`

---

## Phase 5 — User Service Pages (Visual Upgrade)

### 5A. User Subscription (`src/pages/user/Subscription.tsx`)
- Show active plan + renewal date
- Upgrade/downgrade plan UI
- Read plan names and prices from `subscription_models` (same as LandingPage)
- Cancel subscription flow

### 5B. User BotService (`src/pages/user/BotService.tsx`)
- Remove "Neural Interface" jargon (Phase 3)
- Clean bot token input form
- Bot status indicator (active / inactive)
- Quick-start guide for Telegram bot setup

### 5C. User Email Section (`src/pages/user/email/`)
- **EmailLayout** — sidebar navigation between email sub-pages
- **UserMail** — sent/inbox mail view
- **EmailTemplates** — template builder with preview
- **EmailSettings** — SMTP settings for this user's account
- **ContactLists** — manage contact groups

### 5D. User Profile (`src/pages/user/Profile.tsx`)
- Avatar upload via Cloudinary
- Name, email, phone fields
- Password change
- 2FA status (if applicable)

### 5E. User Support (`src/pages/user/Support.tsx`)
- Create new ticket form
- Ticket list with status badges (Open / In Progress / Resolved)
- Link to Knowledge Base

### 5F. User Notifications (`src/pages/user/Notifications.tsx`)
- Notification feed with read/unread states
- Mark all as read
- Notification type badges

### 5G. User Help (`src/pages/user/Help.tsx`)
- Search bar across knowledge base articles
- Category-organized FAQ cards
- "Contact Support" CTA

### 5H. User Sessions (`src/pages/user/Sessions.tsx`)
- Active session list with device / IP / date
- Revoke session button

**Effort:** Large (8 files)

---

## Phase 6 — Admin Core Pages (Visual + Terminology)

### 6A. Admin Dashboard (`src/pages/admin/Dashboard.tsx`)
- Remove "Admin HQ" / "Active Nodes" jargon (Phase 3)
- Stat cards: Total Users, Active Projects, Pending Payments, Open Issues
- Recent user signups table
- Quick actions: Approve Payments, View Chats, New Broadcast

### 6B. Admin Users (`src/pages/admin/Users.tsx`)
- Remove "Entity Registry" jargon (Phase 3)
- User table: Name, Email, Role, Joined, Status
- Status badges: Active / Suspended / Pending
- Quick actions: View, Suspend, Reset Password

### 6C. Admin Payments (`src/pages/admin/Payments.tsx`)
- Remove "Fiscal_Review" jargon (Phase 3)
- Tabs: Pending / Approved / Rejected
- Payment card with: user, amount, method, date, action buttons
- Approval flow: Approve (green) / Reject (red)

### 6D. Admin Chats (`src/pages/admin/Chats.tsx`)
- Confirm terminology is clean
- Real-time chat list with unread count badges
- User info panel on right

### 6E. Admin CRM (`src/pages/admin/CRM.tsx`)
- Client contact list
- Notes per client
- Last contact date
- Tags/labels

**Effort:** Large (5 files)

---

## Phase 7 — Admin Utilities

### 7A. Admin Issues (`src/pages/admin/Issues.tsx`)
- Remove "Anomaly Logs" jargon (Phase 3)
- Issue cards with: title, severity, status, assigned user, date
- Status flow: Open → In Progress → Resolved

### 7B. Admin Fixes (`src/pages/admin/Fixes.tsx`)
- Remove "Anomaly Restoration" jargon (Phase 3)
- Fix log table with: user, issue, fix applied, date, notified?
- "Notify User" button (clean name, not "RELAY_USER")

### 7C. Admin Projects (`src/pages/admin/Projects.tsx`)
- Remove internal status strings (Phase 3)
- Project cards with: client name, project type, status badge, deadline
- Professional status labels: Planning → In Progress → Review → Deployed

### 7D. Admin KnowledgeBase (`src/pages/admin/KnowledgeBase.tsx`)
- Article list with categories
- Rich-text editor for article content
- Publish / Draft toggle
- User-facing preview link

### 7E. Admin Broadcast (`src/pages/admin/Broadcast.tsx`)
- Compose broadcast message
- Target audience selector: All Users / Specific Role / Specific User
- Delivery method: In-app notification / Email
- Sent broadcast history

### 7F. Admin Mail (`src/pages/admin/Mail.tsx`)
- Admin-level email view (SMTP / EmailJS logs)
- Compose message to a user
- Template selector

**Effort:** Medium-Large (6 files)

---

## Phase 8 — SuperAdmin + Auth Pages

### 8A. SuperAdmin Dashboard (`src/pages/superadmin/Dashboard.tsx`)
- Platform health overview: total users, total revenue, active subscriptions, active bots
- Fiscal configuration panel (bank details for manual payments)
- Quick links to PlatformSettings, ManageAdmins, AuditLogs
- Recent audit log feed

### 8B. SuperAdmin ManageAdmins (`src/pages/superadmin/ManageAdmins.tsx`)
- Admin staff list with role badge
- Promote / Demote / Suspend actions
- Invite new admin by email

### 8C. SuperAdmin Coupons (`src/pages/superadmin/Coupons.tsx`)
- Coupon creator: code, type, discount amount/%, usage limit, expiry
- Active coupon list
- Usage statistics per coupon
- Referral milestone rules

### 8D. SuperAdmin AuditLogs (`src/pages/superadmin/AuditLogs.tsx`)
- Full-text searchable audit log table
- Filter by: role, action type, date range
- Export to CSV

### 8E. Auth Pages
- **Login** (`src/pages/auth/Login.tsx`) — modernize design, add brand logo, dark mode
- **Signup** (`src/pages/auth/Signup.tsx`) — clean multi-field form, terms checkbox
- **VaultLogin/VaultSignup** — consistent with brand
- **StaffLogin** — admin-facing, clean design

**Effort:** Large (9 files)

---

## Phase 9 — Public & Utility Pages

### 9A. VerifyReceipt (`src/pages/public/VerifyReceipt.tsx`)
- Public page to verify purchase receipts by code
- Brand logo + clean layout
- Valid receipt: show product, buyer name, date, amount
- Invalid receipt: clear error state

### 9B. Admin Transactions (`src/pages/admin/AdminTransactions.tsx`)
- Transaction log: date, user, amount, type, method, status
- Filter by type and date range
- Total summary bar

### 9C. Admin Sessions (`src/pages/admin/Sessions.tsx`)
- All active user sessions
- Device / IP / last active
- Force logout option

**Effort:** Small-Medium (3 files)

---

## Feature Suggestions (Not Yet Built)

These are entirely new features that don't exist yet but would significantly increase platform value:

| # | Feature | Where | Why |
|---|---|---|---|
| S1 | **Product Detail Page** | Public `/product/:id` | Users can view full product info before adding to cart; reduces friction |
| S2 | **Admin Product Image Manager** | Admin Marketplace | Currently images are URLs only; add Cloudinary uploader per product |
| S3 | **Referral System UI** | User Dashboard | SuperAdmin already defines referral milestones; users need to see their referral link and progress |
| S4 | **In-app Notification Center** | All roles | Bell icon in nav → dropdown with recent notifications; already have `user_notifications` in Firestore |
| S5 | **Admin Chat Read Receipts** | Admin Chats | Show "seen" indicators; makes the chat feel professional |
| S6 | **User Onboarding Flow** | After Signup | 3-step wizard: choose service type → confirm contact → see dashboard. Reduces drop-off |
| S7 | **Subscription Renewal Alerts** | User Dashboard | Banner or notification when subscription is 7 days from expiry |
| S8 | **Receipt PDF Generation** | User Orders + VerifyReceipt | Generate downloadable PDF receipt per order using browser `window.print()` styled CSS |
| S9 | **Admin Dashboard Charts** | Admin Dashboard | Recharts — signups over time, revenue chart, project status breakdown |
| S10 | **Platform Announcements Banner** | All public pages | SuperAdmin posts a global announcement; shown as a dismissable top banner |

---

## Execution Priority Matrix

| Phase | Pages | Complexity | Priority |
|---|---|---|---|
| **Phase 1** | User Marketplace, Admin Marketplace | Medium | 🔴 High — user-facing jargon NOW |
| **Phase 2** | LandingPage + PlatformSettings | Medium | 🔴 High — data should be live |
| **Phase 3** | 10 pages (text changes only) | Small | 🔴 High — jargon cleanup across board |
| **Phase 4** | User Dashboard, Cart, Orders, Wallet | Medium | 🟠 Medium — core user journey |
| **Phase 5** | Subscription, BotService, Email, Profile, Support, Notifications, Help, Sessions | Large | 🟠 Medium — service pages |
| **Phase 6** | Admin Dashboard, Users, Payments, Chats, CRM | Large | 🟠 Medium — admin operations |
| **Phase 7** | Issues, Fixes, Projects, KnowledgeBase, Broadcast, Mail | Medium | 🟡 Lower — utilities |
| **Phase 8** | SuperAdmin pages + Auth | Large | 🟡 Lower — infrequently visited |
| **Phase 9** | VerifyReceipt, Transactions, Sessions | Small | 🟡 Lower — edge cases |

---

## Files Touched So Far (Completed)

- `src/pages/LandingPage.tsx` ✅
- `src/pages/public/PublicLayout.tsx` ✅
- `src/pages/public/Store.tsx` ✅
- `src/pages/TermsAndConditions.tsx` ✅

## Full File Target List (Remaining)

```
Phase 1:  src/pages/user/Marketplace.tsx
          src/pages/admin/Marketplace.tsx

Phase 2:  src/pages/LandingPage.tsx (subscription price update)
          src/pages/superadmin/PlatformSettings.tsx (add subscriptions tab)
          src/lib/platformSettings.ts (add subscriptions type)

Phase 3:  src/pages/admin/Dashboard.tsx
          src/pages/admin/Users.tsx
          src/pages/admin/Payments.tsx
          src/pages/admin/Issues.tsx
          src/pages/admin/Fixes.tsx
          src/pages/admin/Projects.tsx
          src/pages/user/Wallet.tsx
          src/pages/user/Subscription.tsx
          src/pages/user/Projects.tsx
          src/pages/user/BotService.tsx

Phase 4:  src/pages/user/Dashboard.tsx
          src/pages/user/Cart.tsx
          src/pages/user/Orders.tsx
          src/pages/user/Wallet.tsx

Phase 5:  src/pages/user/Subscription.tsx
          src/pages/user/BotService.tsx
          src/pages/user/email/EmailLayout.tsx
          src/pages/user/email/UserMail.tsx
          src/pages/user/email/EmailTemplates.tsx
          src/pages/user/email/EmailSettings.tsx
          src/pages/user/email/ContactLists.tsx
          src/pages/user/Profile.tsx
          src/pages/user/Support.tsx
          src/pages/user/Notifications.tsx
          src/pages/user/Help.tsx
          src/pages/user/Sessions.tsx

Phase 6:  src/pages/admin/Dashboard.tsx
          src/pages/admin/Users.tsx
          src/pages/admin/Payments.tsx
          src/pages/admin/Chats.tsx
          src/pages/admin/CRM.tsx

Phase 7:  src/pages/admin/Issues.tsx
          src/pages/admin/Fixes.tsx
          src/pages/admin/Projects.tsx
          src/pages/admin/KnowledgeBase.tsx
          src/pages/admin/Broadcast.tsx
          src/pages/admin/Mail.tsx

Phase 8:  src/pages/superadmin/Dashboard.tsx
          src/pages/superadmin/ManageAdmins.tsx
          src/pages/superadmin/Coupons.tsx
          src/pages/superadmin/AuditLogs.tsx
          src/pages/auth/Login.tsx
          src/pages/auth/Signup.tsx
          src/pages/auth/VaultLogin.tsx
          src/pages/auth/VaultSignup.tsx
          src/pages/auth/StaffLogin.tsx

Phase 9:  src/pages/public/VerifyReceipt.tsx
          src/pages/admin/AdminTransactions.tsx
          src/pages/admin/Sessions.tsx
```

---

*Total remaining files: ~40 pages across 9 phases.*  
*Each phase can be executed independently. Phases 1–3 should be executed first as they are high-impact, low-risk changes.*
