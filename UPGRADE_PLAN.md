# Durex Team Platform — Upgrade & Security Plan

**Created:** June 11, 2026  
**Status:** Pending Execution  
**Scope:** Security hardening, terminology cleanup, feature completion, and code quality improvements.

---

## Executive Summary

The platform has a solid foundation — multi-role RBAC, real-time chat, marketplace, wallet, and audit logging are all structurally in place. However, several **critical security vulnerabilities**, **incomplete features**, and **terminology inconsistencies** must be addressed before this can be considered production-ready.

---

## Phase 1 — Critical Security Fixes 🔴
> **Priority: Immediate. These are live vulnerabilities.**

### 1.1 — Remove Plaintext Password Storage
- **Issue:** `AuthContext.tsx` saves the raw password string to the Firestore `admins` collection during vault registration (`password: password`).
- **Fix:** Remove the `password` field entirely from the Firestore document. Firebase Auth handles credential storage securely — it must never be duplicated in the database.

### 1.2 — Move Vault PIN to a Server-Side Secret
- **Issue:** The admin registration PIN (`8829`) is hardcoded in `VaultSignup.tsx` on the client side. Anyone who reads the source code can register as an admin.
- **Fix:** Move PIN validation to a Firebase Cloud Function. The client submits the PIN; the function validates it server-side against an environment variable. The client never sees the PIN.

### 1.3 — Remove Hardcoded Bootstrap Admin Email from Firestore Rules
- **Issue:** `firestore.rules` grants permanent super admin access to the email `tonymicah81@gmail.com` by hardcoding it into the rules. This is a privilege escalation risk and an exposure of PII in source code.
- **Fix:** Remove the `isBootstrapAdmin` / `isBootstrapSuper` shortcuts from the rules. The real owner account should be properly seeded in the `admins` collection with a `super_admin` role.

### 1.4 — Secure Cloudinary Credentials
- **Issue:** `.env.example` exposes the Cloudinary Cloud Name, Upload Preset, and API Key. The `ml_default` upload preset is Cloudinary's unsigned default — meaning anyone can upload to the account without authentication.
- **Fix:** 
  - Create a signed, restricted Cloudinary upload preset for this app only.
  - Move API credentials to Replit Secrets (environment variables) and never commit them.
  - Validate file uploads server-side via a Cloud Function proxy.

### 1.5 — Fix Firestore `isValidUser` Rule Bug
- **Issue:** `firestore.rules` Line 54: `data.uid == request.auth.id` — should be `request.auth.uid`. This means the validation silently fails and the rule is not enforcing what it intends to.
- **Fix:** Correct the typo to `request.auth.uid`.

---

## Phase 2 — Financial & Data Integrity 🔴
> **Priority: High. Financial data must be atomic and trustworthy.**

### 2.1 — Implement Atomic Balance Updates via Cloud Function
- **Issue:** When an admin approves a wallet deposit, the `transactions` document status is updated but the user's `balance` field in `users` is never actually changed. Money is approved but never credited.
- **Fix:** Create a Cloud Function triggered on `transactions/{id}` document update. When `status` changes to `'approved'`, atomically increment the user's `balance` using a Firestore transaction (not a plain `updateDoc`).

### 2.2 — Enforce Transaction Immutability
- **Issue:** There is no rule preventing a user from submitting a `deposit` transaction with a fabricated large amount, or re-submitting approved transactions.
- **Fix:** Add server-side amount validation in the Cloud Function and tighten Firestore rules to prevent users from modifying their own transactions after creation.

### 2.3 — Move Balance Deduction to Server Side
- **Issue:** Marketplace purchases and balance deductions appear to be handled client-side.
- **Fix:** Route all purchase/deduction operations through a Cloud Function that validates the user has sufficient balance before completing any transaction.

---

## Phase 3 — Terminology & UX Cleanup 🟡
> **Priority: Medium. Affects usability and professionalism.**

### 3.1 — Standardize Role Naming
- **Issue:** The codebase uses `'client'`, `'user'`, `'admin'`, and `'staff'` inconsistently across `AuthContext.tsx`, `firestore.rules`, and the UI. Vault-registered users get a role of `'client'` but are added to the `admins` collection.
- **Fix:** Define and enforce a single role taxonomy:
  | Role | Collection | Access Level |
  |------|-----------|-------------|
  | `user` | `users` | Client dashboard |
  | `admin` | `admins` | Admin panel |
  | `super_admin` | `admins` | Full system access |

### 3.2 — Replace Overly Stylized Jargon
- **Issue:** Some UI labels prioritize aesthetic over clarity, making the app harder to use.
- **Replacements:**

  | Current Label | Replacement |
  |---|---|
  | Fiscal Terminal | Wallet |
  | Entity Registry | User Management |
  | Anomaly Restoration | Bug Fixes / Repairs |
  | Propose Fiscal Transfusion | Request Deposit |
  | Vault Protocol | Staff Registration |
  | Fiscal Signature | Payment Proof |

- Keep the tech/fintech aesthetic in visual design (colors, layout, animations) — only replace labels that obscure meaning.

### 3.3 — Clarify Project Status Labels
- **Issue:** Project statuses like `"email spam setup complete"` and `"smartsupp working"` are internal developer notes, not client-facing labels.
- **Fix:** Replace with clean, professional status labels:
  - `Pending` → `In Queue`
  - `Domain Bought` → `Domain Registered`
  - `Email Spam Setup Complete` → `Email Configured`
  - `Smartsupp Working` → `Live Chat Enabled`
  - `Hosted` → `Deployed`
  - `Delivered` → `Completed`

---

## Phase 4 — Feature Completion 🟡
> **Priority: Medium. Core features are structurally present but not fully wired.**

### 4.1 — Complete File Upload Integration (Cloudinary)
- **Issue:** Wallet proof-of-payment uploads and chat file attachments use placeholder/mock logic instead of real Cloudinary uploads.
- **Fix:** Wire up the existing Cloudinary credentials to actual upload calls. Validate file type and size before upload. Store the returned URL in Firestore.

### 4.2 — Fix Chat Conversation Creation Flow
- **Issue:** `chatService.ts` returns an empty string when no conversation exists, leaving the caller (`Support.tsx`) to handle creation — but it doesn't do so cleanly. First message flow is broken.
- **Fix:** Refactor `getOrCreateConversation` to atomically create the conversation document if it doesn't exist, then return the ID — one clean call, no ambiguity.

### 4.3 — Implement 2FA (or Remove the Placeholder)
- **Issue:** `tfaEnabled` is referenced in the Firestore rules and user profile but there is no 2FA implementation. It's a dead field that creates a false sense of security.
- **Fix (Option A):** Implement TOTP-based 2FA using Firebase's multi-factor authentication support.  
  **Fix (Option B):** Remove the `tfaEnabled` field and all references to it until it is properly built.

### 4.4 — Notifications System Wiring
- **Issue:** The broadcast and notification creation flows exist, but user-facing notification read states and badge counts are not reliably updating in real time across sessions.
- **Fix:** Standardize the notification listener in `AuthContext` and ensure unread counts derive from a single source of truth.

---

## Phase 5 — Code Quality & TypeScript 🟢
> **Priority: Low-Medium. Improves maintainability and catches bugs early.**

### 5.1 — Replace `any` Types with Proper Interfaces
- **Issue:** `AuthContext.tsx` and several page components use `any` for user profiles, form data, and Firestore documents — defeating the purpose of TypeScript.
- **Fix:** Define and export typed interfaces for all Firestore document shapes:
  - `UserProfile`, `AdminProfile`, `Transaction`, `Project`, `ChatMessage`, `Notification`

### 5.2 — Standardize Firebase Imports
- **Issue:** Some components use dynamic imports (`../../firebase`) inside helper functions; others import at the top level. This is inconsistent and can cause initialization issues.
- **Fix:** All Firebase service imports (`db`, `auth`, `storage`) should be top-level static imports from a single `src/lib/firebase.ts` export.

### 5.3 — Improve Error Handling
- **Issue:** Most `catch` blocks only call `console.error(err)` with no user feedback. When a Firestore security rule rejects a write, the user sees nothing.
- **Fix:** Implement a centralized error handler that maps Firebase error codes to user-friendly messages (e.g., `permission-denied` → "You don't have permission to do that.").

### 5.4 — Optimize Real-Time Listeners
- **Issue:** `Support.tsx` sets up multiple overlapping `onSnapshot` listeners that are not always cleaned up, which can cause memory leaks and duplicate events.
- **Fix:** Audit all `onSnapshot` calls — ensure every listener is returned and unsubscribed in a `useEffect` cleanup function.

### 5.5 — Address npm Vulnerabilities
- **Issue:** `npm install` reported 10 vulnerabilities (6 moderate, 4 high).
- **Fix:** Run `npm audit fix` and manually review any breaking changes before applying `--force`.

---

## Phase 6 — Polish & Production Readiness 🟢
> **Priority: Final step before deployment.**

### 6.1 — Environment Variable Audit
- Audit all hardcoded values and move them to Replit Secrets / `.env`.
- Ensure no secrets are exposed in the client bundle (only `VITE_` prefixed vars are safe to expose).

### 6.2 — Responsive Design Pass
- Audit all pages on mobile and tablet viewports.
- Fix any layout breakage in the admin dashboard tables and chat UI.

### 6.3 — Loading & Empty States
- Ensure every data-fetching page has a loading skeleton and a proper empty state (not just a blank screen).

### 6.4 — Deploy & Configure Firebase Security Rules
- Deploy the corrected Firestore security rules to the live Firebase project.
- Run the Firebase Rules emulator with test cases to validate before deploying.

### 6.5 — Final Security Checklist
- [ ] No plaintext passwords in database
- [ ] No secrets in source code
- [ ] Firestore rules deny all by default (already done ✓)
- [ ] All financial operations go through Cloud Functions
- [ ] Cloudinary uploads are signed and restricted
- [ ] Bootstrap admin email removed from rules

---

## Execution Order Summary

| Phase | Focus | Risk Level | Est. Effort |
|-------|-------|-----------|-------------|
| Phase 1 | Critical Security Fixes | 🔴 Critical | Medium |
| Phase 2 | Financial Integrity | 🔴 Critical | High |
| Phase 3 | Terminology & UX | 🟡 Medium | Low |
| Phase 4 | Feature Completion | 🟡 Medium | High |
| Phase 5 | Code Quality | 🟢 Low | Medium |
| Phase 6 | Polish & Production | 🟢 Low | Medium |

---

*This plan should be reviewed and approved before any phase begins. Each phase can be executed independently.*
