---
name: Role System
description: The 4-role taxonomy, which collection each role lives in, and the deliberate 'client' staging role.
---

## Rule
There are exactly 4 roles. The `client` role is intentional — it's a staging state for new vault registrations awaiting super admin approval.

| Role | Collection | Access | Notes |
|---|---|---|---|
| `user` | `users` | Client dashboard only | Registers via public signup |
| `client` | `admins` | None (blocked) | Registered via vault; pending approval |
| `admin` | `admins` | Admin panel | Super admin manually sets in Firestore |
| `super_admin` | `admins` | Full system access | Super admin manually sets in Firestore |

**Why `client` in `admins` collection:** The user (owner) wants to manually approve every staff member. New vault signups land as `client/inactive` in `admins`. Super admin logs into Firestore console and changes `role` to `admin` and `status` to `active`. No code path auto-promotes anyone. This is deliberate security.

**Why:** This prevents rogue registrations — even if someone finds the vault URL and registers, they can do nothing until the owner physically changes their Firestore record.

## How to apply
- `isAdmin()` in `firestore.rules` must check `role in ['admin', 'super_admin']` — NOT just collection membership
- `isAdmin` in `AuthContext.tsx` checks `profile.role === 'admin' || profile.role === 'super_admin'`
- Never add 'client' to either `isAdmin` check
- Vault signup always writes `role: 'client'` — do not change this
