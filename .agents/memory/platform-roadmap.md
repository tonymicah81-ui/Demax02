---
name: Platform Roadmap Architecture
description: Full feature map of what was built — services, pages, collections, and key design decisions.
---

## Visitor Cart
- `visitor_carts` Firestore collection (public read/write — non-sensitive product IDs only)
- `dt_vid` in localStorage (crypto.randomUUID)
- `src/lib/visitorCart.ts` — getOrCreateVisitorId, addToVisitorCart, removeFromVisitorCart, transferVisitorCartToUser
- Transfer happens on signin AND register in AuthContext, fire-and-forget

## Session Management
- `sessions` Firestore collection, 48h expiry stored as ISO string
- `dt_sid` (session doc ID) + `dt_session_expires` in localStorage
- `src/lib/sessionService.ts` — createSession, validateAndRefreshSession, revokeSession, clearCurrentSession
- Session created in AuthContext `signin` and `register` functions
- validateAndRefreshSession() called on auth state change — if invalid/expired, auto-signout

## Orders + Receipts
- `orders` collection: created inside `runTransaction` on cart checkout alongside transaction + notification
- `receipts` collection: created OUTSIDE transaction (non-critical) via `createReceipt()`
- Receipt format: `DT-{YEAR}-{6 uppercase alphanumeric}` — `src/lib/receiptService.ts`
- Cart checkout shows confirmation modal (not alert) with receipt number + "View Orders" CTA
- Public verification at `/verify/:receiptNumber` — shows masked user info

## New Pages Built
- `src/pages/public/Store.tsx` — anonymous browsing + visitor cart + cart slide panel
- `src/pages/public/PublicLayout.tsx` — navbar with cart badge, login/signup, theme toggle
- `src/pages/public/VerifyReceipt.tsx` — public receipt verification
- `src/pages/user/Orders.tsx` — user order history with receipt modal + print
- `src/pages/user/Sessions.tsx` — user active sessions, revoke capability
- `src/pages/admin/AdminTransactions.tsx` — all platform transactions, filterable by type
- `src/pages/admin/Sessions.tsx` — admin view of all active sessions, revoke capability

## Dashboard Fixes
- User Dashboard: real unread messages from `conversations` onSnapshot; real notifications from `user_notifications`
- Admin Dashboard: fixed `chats` → `conversations` bug; real audit_logs in operational stream
- SuperAdmin Dashboard: replaced fake metrics with real onSnapshot: users count, revenue (completed payments), orders count, active sessions count

## UserDetails Rebuild
- 6 tabs: Overview, Projects, Transactions, Orders, Sessions, Admin Actions
- Admin Actions: balance adjustment (creates transaction + audit log + user notification), account suspend/reactivate
- Session tab: admin can revoke individual user sessions

## LandingPage
- Products section now uses onSnapshot from `products` collection
- Shows featured (featured==true) products first, falls back to first 6 all products
- Falls back to hardcoded service cards if no Firestore products exist
- "Browse Store" links to /store on hero and products section

## Routes Added (App.tsx)
- `/store` — PublicLayout wrapping Store
- `/verify/:receiptNumber` — public, no layout
- `/orders` — protected user route
- `/sessions` — protected user route
- `/admin/transactions` — admin route
- `/admin/sessions` — admin route

## Sidebar Links Added
- User: Public Store, My Orders, Sessions
- Admin: Transactions, Sessions

**Why:**
The visitor cart transfer must be fire-and-forget (wrapped in try/catch) so auth flow never blocks on it. Session creation must be after auth so we have the uid. The `orders` doc is created inside `runTransaction` to ensure atomicity with the balance deduction — `receipts` is outside (non-critical, can fail without rolling back purchase).
