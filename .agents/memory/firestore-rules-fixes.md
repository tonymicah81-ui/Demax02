---
name: Firestore Rules Critical Fixes
description: Rules bugs that caused silent failures in production, and new collections added.
---

## Pre-existing Bugs Fixed

### 1. Missing `carts` collection rule
- Code uses `carts` collection for user cart items (Cart.tsx, Marketplace.tsx)
- Original rules only had `cart_items` — mismatch caused all cart operations to be denied
- **Fix:** Added explicit `carts` rule: user can CRUD their own carts

### 2. Transactions create rule blocked checkout
- Original `isValidTransaction` required `amount > 0` AND `status == 'pending'`
- Cart checkout creates transactions with `status: 'completed'` and `amount: total` (positive)
- **Fix:** Expanded rule to allow: deposit (amount>0, pending), payment (completed), refund (completed), adjustment

### 3. `user_notifications` blocked user self-create
- Original rule: `allow create: if isAdmin()` only
- Cart checkout creates user_notifications in `runTransaction` as the user themselves
- **Fix:** `allow create: if isAdmin() || (isSignedIn() && incoming().userId == request.auth.uid)`

## New Collections Added
- `visitor_carts` — `allow read, write: if true` (non-sensitive product IDs, public anonymous cart)
- `marketplace_views` — `allow create: if true`, `allow read: if isAdmin()`
- `sessions` — user can read/create/update own; admin can read/update/revoke all
- `orders` — user can read own + create own; admin can update; superadmin delete
- `receipts` — `allow read: if true` (public verification), user creates own
- `fixes` — user creates own, admin updates status
- `admin_notifications` — admin reads, any signed-in user can create (for checkout alerts)

## IMPORTANT: Deploy Required
These rules are in `firestore.rules` but must be deployed to Firebase for them to take effect.
Public store (`/store`) will show permission errors for anonymous visitors until rules are deployed.
Command: `firebase deploy --only firestore:rules`
