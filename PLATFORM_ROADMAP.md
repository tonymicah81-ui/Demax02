# Durex Team Platform — Full Roadmap & Execution Plan

> Generated: June 12, 2026  
> Scope: Marketplace (public), Dashboards, Sessions, UserDetails, Transactions, Receipts, Orders  
> Constraint: No backend — Firestore + Firebase Auth only

---

## Current State Audit (What's Actually Built)

| Feature | State | Notes |
|---|---|---|
| Marketplace (user) | ⚠️ Partial | Behind auth wall — no public access |
| Cart + Checkout | ✅ Works | But saves no `items` detail, no order record |
| Wallet + Deposits | ✅ Works | Proof upload is mocked (filename only) |
| Admin Payments | ✅ Works | Approve/reject deposits correctly |
| Admin Marketplace | ✅ Works | CRUD categories, products, subscriptions |
| User Dashboard | ⚠️ Partial | "Relay Messages" hardcoded "00", notifications fake |
| Admin Dashboard | ⚠️ Broken | Reads wrong `chats` collection, activity feed all fake |
| SuperAdmin Dashboard | ⚠️ Partial | Fake metrics (1.2 PHz etc), only bank details is real |
| UserDetails (admin) | ⚠️ Skeleton | No projects, no transactions, no orders shown |
| Protected Routes | ✅ Works | UserProtectedRoute, AdminRoute, SuperAdminRoute all exist |
| Session Tracking | ❌ Missing | Firebase Auth only — no Firestore session docs |
| Orders Collection | ❌ Missing | Checkout clears cart + records payment but saves no items |
| Receipts | ❌ Missing | No receipt generation or viewing |
| Admin Transactions | ❌ Missing | Only admin/payments shows deposits — no all-transactions page |
| Public Marketplace | ❌ Missing | No public `/store` route exists |
| Visitor Tracking | ❌ Missing | No anonymous view collection |
| Landing Page (live data) | ❌ Missing | Products section hardcoded, no Firestore pull |

---

## New Firestore Collections Required

### `orders`
Stores what was purchased in each checkout. Created during cart checkout.

```
orders/{orderId}
  userId: string
  userEmail: string
  username: string
  items: [{ productId, name, price, image, categoryId }]
  subtotal: number
  total: number
  status: 'completed' | 'processing' | 'cancelled'
  transactionId: string        // ref to transactions doc
  receiptNumber: string        // DT-YYYY-XXXXXX format
  createdAt: Timestamp
  deliveredAt?: Timestamp
```

### `sessions`
Tracks login sessions with 2-day expiry countdown.

```
sessions/{sessionId}
  userId: string
  role: 'user' | 'admin' | 'super_admin'
  createdAt: Timestamp
  expiresAt: Timestamp         // createdAt + 48 hours
  lastActive: Timestamp
  deviceInfo: string           // navigator.userAgent truncated
  active: boolean
  revokedAt?: Timestamp
  revokedBy?: string           // adminId if force-revoked
```

### `marketplace_views`
Tracks product views by visitors and users. No backend needed — visitorId from localStorage.

```
marketplace_views/{docId}
  visitorId: string            // UUID stored in localStorage ('dt_vid')
  userId: string | null        // null if not logged in
  productId: string
  productName: string
  source: 'landing' | 'store' | 'direct'
  viewedAt: Timestamp
```

### `receipts`
Generated client-side when an order completes. Stored for verification.

```
receipts/{receiptNumber}
  orderId: string
  transactionId: string
  userId: string
  userEmail: string
  username: string
  items: [{ name, price }]
  total: number
  issuedAt: Timestamp
  verificationCode: string     // short hash of orderId + userId + total
```

---

## Phases

---

## Phase 1 — Public Marketplace + Visitor Tracking
**Goal:** Anyone can browse the marketplace without logging in. Visitors are tracked anonymously. Attempting to buy redirects to login.

### Files to create:
- `src/pages/public/Store.tsx` — public marketplace page (categories, search, grid)
- `src/pages/public/ProductDetail.tsx` — single product public page

### Files to update:
- `src/App.tsx` — add public routes `/store` and `/store/:productId`
- `src/pages/LandingPage.tsx` — pull 6 latest/featured products from Firestore; link "View All" to `/store`
- `src/pages/user/Marketplace.tsx` — when user is logged in, use same `/marketplace` but link Cart button
- `src/lib/visitorTracking.ts` — new helper: `getOrCreateVisitorId()` (localStorage UUID), `trackProductView(productId, source)`

### Visitor tracking logic:
1. On Store.tsx load → `getOrCreateVisitorId()` reads `localStorage.getItem('dt_vid')`, or generates a new `uuid` and saves it
2. When a product card is viewed (intersection observer or on click) → write to `marketplace_views`
3. On product "Buy Now" click → if not logged in, redirect to `/login?redirect=/store/:id`
4. On login, if `redirect` query param present → go there after auth
5. Admin can see view counts per product in Admin Marketplace page

### Firestore rules for `marketplace_views`:
- `create`: anyone (rate-limited by write quota)
- `read`: admin only

### Route structure after Phase 1:
```
/ (landing page — shows 6 featured products from Firestore)
/store (public marketplace)
/store/:productId (public product detail)
/marketplace (same content, logged-in users, has cart button)
```

---

## Phase 2 — Orders + Receipts System
**Goal:** Every checkout creates an `orders` doc with full item detail. Receipts are generated and viewable. Users can see their order history.

### Files to create:
- `src/pages/user/Orders.tsx` — user's order history with receipt viewer
- `src/pages/public/VerifyReceipt.tsx` — public page at `/verify/:receiptNumber` showing receipt authenticity
- `src/lib/receiptService.ts` — `generateReceiptNumber()`, `createReceipt()`, `getReceipt()`

### Files to update:
- `src/pages/user/Cart.tsx` — on checkout:
  1. Create `orders` doc with full items array
  2. Create `receipts` doc with `receiptNumber`
  3. Update `transactions` doc to include `orderId`
  4. Navigate to `/orders?new=<orderId>` instead of alert
- `src/App.tsx` — add `/orders` (protected), `/verify/:receiptNumber` (public)
- `src/components/navigation/Sidebar.tsx` — add "Orders" link under user section

### Receipt number format:
```
DT-{YEAR}-{6 random uppercase alphanumeric chars}
e.g. DT-2026-A8F3KZ
```

### Receipt viewer:
- Modal with Durex Team header, user info, items table, total, receipt number, QR code (links to `/verify/:receiptNumber`)
- Print button uses `window.print()` with CSS `@media print` hiding the modal chrome
- Admin can view receipts from AdminTransactions page

### Verification page (`/verify/:receiptNumber`):
- Public page (no login needed)
- Reads `receipts/{receiptNumber}` from Firestore
- Shows: "VERIFIED / AUTHENTIC" badge, user (masked: "J*** D***"), amount, date
- This lets external parties verify a receipt is real

---

## Phase 3 — Session Management (2-Day Countdown)
**Goal:** Track all login sessions in Firestore. Sessions expire after 48 hours. Users see a countdown. Admins can revoke sessions.

### Files to create:
- `src/lib/sessionService.ts` — `createSession()`, `validateSession()`, `refreshSession()`, `revokeSession()`
- `src/pages/user/Sessions.tsx` — user can see and revoke their own sessions
- `src/pages/admin/Sessions.tsx` — admin can see all active sessions, force-revoke any

### Files to update:
- `src/AuthContext.tsx`:
  - On login: call `createSession(uid, role)` → writes to `sessions` collection
  - On auth state restore: call `validateSession(sessionId)` → if expired or revoked → sign out
  - Store `sessionId` in `localStorage` (key: `dt_sid`)
  - Expose `sessionExpiresAt` and `sessionTimeRemaining` in context
- `src/components/guards/ProtectedRoute.tsx`:
  - If `sessionTimeRemaining < 30 minutes` → show a "Session expiring in X:XX" banner at top
  - If session expired → sign out and redirect to `/login`
- `src/components/navigation/Topbar.tsx`:
  - Add session expiry indicator (small countdown badge when < 2 hours remain)
  - "Extend Session" button refreshes the expiry to now + 48h

### Session lifecycle:
```
Login → createSession() → expiresAt = now + 48h
On each page visit → update lastActive
If expiresAt < now → auto sign out, delete session doc
If user clicks "Extend Session" → expiresAt = now + 48h (update doc)
If admin revokes → active: false, revokedAt + revokedBy written
On next page load by that user → session invalid → sign out
```

### Firestore rules for `sessions`:
- `create`: authenticated user, only their own uid
- `read`: authenticated user sees own sessions; admin sees all
- `update`: authenticated user updates own lastActive; admin can set active:false
- `delete`: authenticated user deletes own; admin deletes any

### Admin Sessions Page layout:
- Table: User, Role, Created, Expires, Last Active, Device, Status, Revoke button
- Filter: active only / all
- Bulk revoke option
- Stats: total active sessions, by role breakdown

---

## Phase 4 — Dashboard Completion (All 3 Roles)
**Goal:** Every dashboard stat, widget, and feed shows real live data. No more hardcoded placeholders.

### User Dashboard fixes:
| Widget | Current | Fix |
|---|---|---|
| "Relay Messages" stat | Hardcoded "00" | Read `conversations` where `userId == uid`, sum `unreadCount` |
| "System Relays" panel | 3 fake entries | Read `user_notifications` where `userId == uid`, latest 3 |
| Wallet balance | ✅ Real | Keep as-is |
| Active projects | ✅ Real | Keep as-is |
| Browse Marketplace button | Links to `/marketplace` | Link to `/store` for public or `/marketplace` if logged in |

### Admin Dashboard fixes:
| Widget | Current | Fix |
|---|---|---|
| "Unread Signals" | Reads wrong `chats` collection | Change to `conversations` where `unreadCount > 0` |
| "Operational Stream" | 4 hardcoded fake entries | Read `audit_logs` latest 4, ordered by `createdAt desc` |
| No revenue widget | Missing | Add: sum of `transactions` where `type == payment, status == completed` this month |
| No sessions widget | Missing | Add: count of active `sessions` |

### SuperAdmin Dashboard fixes:
| Widget | Current | Fix |
|---|---|---|
| "Engine Processing: 1.2 PHz" | Fake | Replace with: Total Users count (real) |
| "Data Throughput: 8.4 TB/s" | Fake | Replace with: Total completed transactions this month (real) |
| "System Pulse: 0.02ms" | Fake | Replace with: Platform revenue totals (real) |
| Bank details form | ✅ Real | Keep as-is |
| No audit activity | Missing | Add recent audit log feed (last 5 entries) |
| No user growth | Missing | Add: users joined this week |

---

## Phase 5 — UserDetails Page (Admin) Completion
**Goal:** When admin clicks a user from Users list or from chat, they see the full picture — profile, projects, orders, transactions, subscriptions, session status.

### Files to update:
- `src/pages/admin/UserDetails.tsx` — full rebuild into tabbed layout

### Tab structure:
```
[Overview] [Projects] [Transactions] [Orders] [Sessions] [Admin Actions]
```

**Overview tab** (current partial view, improved):
- Profile card (username, email, phone, uid, status, role, joined date)
- Wallet balance (large display)
- Quick stats: total spent, orders count, active projects count, open support tickets

**Projects tab**:
- Read `projects` where `userId == userId`
- Show project name, domain, status, expiry date, subscription link
- Admin can click project → project detail (future)

**Transactions tab**:
- Read `transactions` where `userId == userId`, ordered by `createdAt desc`
- Show type (deposit/payment/refund), amount, status, date
- Click row → view receipt modal (for completed payments)

**Orders tab**:
- Read `orders` where `userId == userId`, ordered by `createdAt desc`
- Show order items, total, receipt number, status
- Click row → view receipt modal
- Admin can update order status (pending → processing → delivered)

**Sessions tab**:
- Read `sessions` where `userId == userId`
- Show active/expired sessions, devices, last activity
- Admin can revoke individual sessions

**Admin Actions tab**:
- Adjust balance (add/subtract with reason — creates a transaction doc)
- Suspend / Reactivate account (updates `status` field)
- Change role (admin → super_admin, etc.)
- Add admin note (stored in `users/{uid}/notes` subcollection)
- All actions logged via `logAudit()`

---

## Phase 6 — Admin Transactions Page
**Goal:** One page for admins to see ALL transactions across all users, filterable, with receipt viewing.

### Files to create:
- `src/pages/admin/AdminTransactions.tsx`

### Files to update:
- `src/App.tsx` — add `/admin/transactions`
- `src/components/navigation/Sidebar.tsx` — add "Transactions" admin link

### Page layout:
```
Header: "All Transactions" | Stats row: Total volume, This month, Pending count
Tabs: [All] [Deposits] [Payments] [Refunds]
Filter row: Search (user/ID), Date range, Status, Amount range
Table:
  - Receipt# | User | Type | Amount | Status | Date | Actions
  - Action: View Receipt, View User
Pagination: 20 per page, Firestore cursor-based
```

### Stats bar (live):
- Total platform volume (sum all completed)
- This month's revenue (payments - refunds)
- Pending deposits count
- Failed transactions count

### Transaction types explained:
| Type | Who creates it | What it means |
|---|---|---|
| `deposit` | User (via wallet) | User uploaded proof, awaiting admin approval |
| `payment` | System (cart checkout) | User bought from marketplace, balance deducted |
| `refund` | Admin action | Admin manually returned funds to user |
| `adjustment` | Admin action | Manual balance correction with reason |

---

## Phase 7 — Landing Page + Marketplace Upgrades
**Goal:** Landing page shows live products. Public store has full browse experience. Checkout flow improved.

### Landing page updates:
1. **Hero** — keep as-is (good)
2. **Featured Products section** — pull `products` from Firestore where `featured: true` (or latest 6 if none featured). Show real product cards with real prices and "View in Store" links
3. **Stats ticker** — show real numbers: "X projects delivered", "X satisfied clients", "Starting from $Y" (pulled from Firestore config)
4. **Testimonials section** — new static section (content from `platform_settings/testimonials` doc, editable by super admin)
5. **CTA section** — "Browse the Store" → `/store`, "Get Started" → `/signup`
6. Add `featured: boolean` field to `products` collection (admin can toggle in Marketplace page)

### Public Store (`/store`) layout:
- Navbar showing login/signup buttons for visitors
- Same category/filter/search as logged-in marketplace
- Product cards: image, name, price, "View Details" button
- On "Add to Cart" click: if not logged in → redirect to `/login?redirect=/store`
- Product view count shown on card (from `marketplace_views` count)

### Checkout flow improvements (Cart page):
1. Checkout → creates `orders` doc and `receipts` doc
2. Shows order confirmation modal instead of `alert()`
3. Confirmation modal shows: order summary, receipt number, "Download Receipt" button
4. Redirect to `/orders` after closing modal
5. Admin gets `admin_notifications` entry with order details

---

## Suggestions (Build These Alongside or After)

### 🟢 High Impact, Low Effort

**1. Featured products toggle in admin**
- Add `featured: boolean` field to products
- Admin Marketplace → product list shows a ⭐ toggle per product
- Landing page automatically shows featured products

**2. Transaction statement export (print)**
- User Wallet page → "Export Statement" button
- Opens a printable HTML view (using `window.print()` + `@media print` CSS)
- Shows: Durex Team header, user info, date range, all transactions table
- Looks like a proper bank statement — no backend needed

**3. Order status tracking with notifications**
- Admin updates order status in Orders tab of UserDetails
- Each status change creates a `user_notifications` entry
- User sees notifications: "Your order #DT-2026-A8F3KZ is now Processing"

**4. Receipt QR code verification**
- Each receipt has a QR code linking to `/verify/:receiptNumber`
- Public page shows "AUTHENTIC" or "NOT FOUND"
- Useful for clients who need to prove they paid for something

### 🟡 Medium Impact

**5. Marketplace wishlists**
- Heart icon on each product card
- Click → adds to `wishlists/{uid}/items` subcollection
- New user page: `/wishlist` (sidebar link)
- No backend needed — pure Firestore

**6. Flash sales / limited-time pricing**
- Add `salePrice?: number` and `saleEndsAt?: Timestamp` to products
- Store page shows countdown timer on discounted products
- When timer expires, product shows regular price
- Admin sets sale in Admin Marketplace edit

**7. Platform analytics (SuperAdmin)**
- New SuperAdmin page: `/superadmin/analytics`
- Revenue by month (bar chart using CSS, no library needed)
- New users per week
- Most purchased products
- Deposit approval rate
- All computed client-side from Firestore queries

**8. Product view analytics (Admin)**
- Admin Marketplace → Products tab shows "X views" per product
- Reads count from `marketplace_views` grouped by `productId`
- Helps admin understand what's popular

### 🔵 Nice to Have

**9. Visitor-to-user conversion tracking**
- On signup, save `visitorId` (from localStorage `dt_vid`) to user's Firestore doc
- SuperAdmin can see: "X visitors signed up this week"
- "X signed-up users came from the public store"

**10. Bulk order / quote request**
- "Request Custom Quote" button in store for orders over $500
- Creates a `quote_requests` collection entry
- Admin reviews and manually creates a transaction/order
- No payment gateway needed

**11. Product image gallery**
- Products currently support `images: string[]` but only show `images[0]`
- Public store product detail page shows a proper image gallery/carousel
- Admin can upload multiple images (via Cloudinary) in product edit

**12. Subscription renewal reminders**
- `projects` have `expiryDate`
- 7 days before expiry: create `user_notifications` entry
- Dashboard shows "X project(s) expiring soon" warning banner
- This needs a session-based check (on Dashboard load, check upcoming expiries)

---

## Execution Order (Recommended)

```
Phase 1 → Phase 2 → Phase 4 → Phase 5 → Phase 3 → Phase 6 → Phase 7
```

**Rationale:**
- Phase 1 (public store) unlocks traffic without login — independent of everything
- Phase 2 (orders + receipts) fixes the broken checkout flow — should happen early
- Phase 4 (dashboards) uses existing collections — fast wins, independent
- Phase 5 (UserDetails) needs orders + transactions from Phase 2
- Phase 3 (sessions) can be added at any point — non-breaking
- Phase 6 + 7 (landing + marketplace upgrades) come last since they depend on featured products and orders being in place

---

## Route Map (After All Phases)

```
PUBLIC (no login)
  /                       Landing page (live products, stats)
  /store                  Public marketplace
  /store/:productId       Product detail
  /verify/:receiptNumber  Receipt verification
  /login?redirect=X       Login with post-login redirect
  /signup
  /terms

USER (protected)
  /dashboard              Dashboard (real stats)
  /marketplace            Browse + add to cart (logged-in view)
  /cart                   Cart + checkout
  /orders                 Order history + receipt download
  /wallet                 Balance + deposits + transaction history
  /subscription           Subscription management
  /projects               Projects overview
  /wishlist               Saved products
  /support                Chat support
  /profile                Profile settings
  /sessions               View / manage own sessions
  /notifications

ADMIN (admin role)
  /admin                  Admin HQ (real metrics)
  /admin/users            User management list
  /admin/users/:userId    Full user detail (all tabs)
  /admin/chats            Support chat hub
  /admin/marketplace      Product/category management (+ featured toggle)
  /admin/payments         Deposit approvals
  /admin/transactions     All platform transactions
  /admin/orders           All orders (status management)
  /admin/sessions         All sessions (revoke capability)
  /admin/projects         Operations
  /admin/issues
  /admin/fixes
  /admin/broadcast

SUPER ADMIN (super_admin role)
  /superadmin             Dashboard (real platform metrics)
  /superadmin/analytics   Revenue charts, user growth, product performance
  /superadmin/admins      Manage admin accounts
  /superadmin/audit       Audit log
  /superadmin/settings    Platform settings (Cloudinary, vault, etc.)
```

---

## Firestore Collections Summary (Complete)

| Collection | Purpose | Phase |
|---|---|---|
| `users` | User profiles | Existing |
| `admins` | Admin/staff profiles | Existing |
| `admin_secrets` | Admin passwords | Existing |
| `projects` | User projects | Existing |
| `transactions` | Deposits, payments, refunds | Existing |
| `conversations` | Chat conversations | Existing |
| `messages` | Chat messages | Existing |
| `products` | Marketplace products | Existing |
| `categories` | Product categories | Existing |
| `sub_categories` | Product sub-categories | Existing |
| `subscription_models` | Subscription tiers | Existing |
| `carts` | Active cart items | Existing |
| `fixes` | Bug fix requests | Existing |
| `user_notifications` | User in-app notifications | Existing |
| `admin_notifications` | Admin in-app alerts | Existing |
| `audit_logs` | Admin action log | Existing |
| `system_config` | Platform config (bank details) | Existing |
| `platform_settings` | Cloudinary, vault, etc. | Existing |
| `vault` | Vault PIN + tracking | Existing |
| `orders` | Checkout orders with items | **Phase 2** |
| `receipts` | Generated receipts | **Phase 2** |
| `sessions` | Login session tracking | **Phase 3** |
| `marketplace_views` | Product view tracking | **Phase 1** |

---

*This document is the execution source of truth. Each phase is self-contained. Phases 1–2–4–5 are the highest priority for a complete MVP.*
