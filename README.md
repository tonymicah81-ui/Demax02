# Durex Team Platform

A multi-role SaaS portal for managing web agency clients, projects, marketplace assets, and staff — built with React 19, Vite, TypeScript, Tailwind CSS 4, and Firebase.

---

## Quick Start

```bash
npm install
npm run dev      # Runs on port 5000
npm run build    # Production build
npm run lint     # Type-check + ESLint
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth & Database | Firebase Auth + Firestore |
| File Storage | Cloudinary (Firebase Storage unavailable) |
| Animations | Framer Motion (motion) |
| Icons | Lucide React |
| Charts | Recharts + D3 |

---

## Roles & Access

| Role | Collection | Where Registered | Access |
|---|---|---|---|
| `user` | `users` | `/signup` (public) | Client dashboard |
| `admin` | `admins` | `/company/vault/signup` (gated) | Admin panel |
| `super_admin` | `admins` | Must be set manually in Firestore | Full platform |

> **To set yourself as super admin:** In Firebase Console → Firestore → `admins` collection → find your document → set `role: "super_admin"` and `status: "active"`.

---

## The Vault System

The Vault is the staff registration/login portal at `/company/vault`.

### How it works

1. Super admin goes to **Platform Settings → Vault** in the dashboard
2. Sets a PIN (stored as a SHA-256 hash — never plain text)
3. Toggles **Vault Active = ON**
4. Now anyone visiting `/company/vault` sees a PIN entry screen first
5. After entering the correct PIN, they see the login/signup options
6. The PIN unlock is stored in `sessionStorage` — users only enter it once per browser session
7. **After 5 wrong attempts**: vault locks for 15 minutes, an alert is written to Firestore `vault_alerts`

### Security notes

- The PIN is hashed with SHA-256 + a salt before storage. The plain PIN is never stored anywhere.
- The vault gate logic lives in `src/components/vault/VaultGate.tsx`. It is a wrapper component — the actual pages (AdminSignupGate, VaultLogin, VaultSignup) only render after the gate passes.
- Attempt tracking uses `localStorage` to survive page refreshes. A lockout also creates a Firestore `vault_alerts` document.
- If vault is **not activated**, visiting `/company/vault` goes straight through — no PIN required (useful for initial setup before you configure it).

### File locations

```
src/components/vault/VaultGate.tsx   ← Gate logic (check + PIN UI)
src/pages/auth/AdminSignupGate.tsx   ← Login or Register choice screen
src/pages/auth/VaultLogin.tsx        ← Staff login form
src/pages/auth/VaultSignup.tsx       ← Staff registration form
```

---

## Platform Settings (Super Admin Only)

Located at `/superadmin/settings` — accessible via "Platform Settings" in the sidebar under "Super Authority".

### General Settings
- **Support Email** — shown in landing page footer and any public-facing email reference. Default: `support@durax.com`
- **Personal Notification Email** — receives security alerts (vault lockouts). Never shown publicly.

### Vault Settings
- Toggle vault active/inactive
- Set/change the vault access PIN
- Must set a PIN before you can activate the vault

### Loading Screen
- **Effect styles**: `default` (progress bar), `pulse` (ring pulse), `scan` (corner scanner), `custom`
- **Custom Logo URL**: Replaces the default DT logo. Recommended: square PNG/SVG, min 200×200px.
- **Custom HTML/CSS** (when `custom` effect selected): Paste your full loading screen HTML and CSS. The HTML renders centered on a dark background; CSS injects into `<head>`.

### Cloudinary Settings
- Enter your Cloud Name, Upload Preset, and API Key
- Click **Test Connection** to verify credentials
- After verifying, remove keys from `.env` — the platform reads Firestore first, falls back to env vars if not set
- Connection status indicator shows live result after testing

---

## Password Storage

Staff (admin) passwords are stored for reference in a **separate Firestore collection** `admin_secrets/{uid}`, readable only by super admin via Firestore rules. They are **not** stored in the main `admins` collection.

> **Note:** This is stored as plain text as requested for reference. For stronger security in future, consider hashing with bcrypt via a Cloud Function.

---

## Cloudinary Setup

Since Firebase Storage is currently unavailable, Cloudinary handles all file uploads (wallet proof-of-payment, chat attachments).

**Priority order for credentials:**
1. Firestore `platform_settings/cloudinary` (set via Platform Settings page)
2. Environment variables in `.env` (fallback during initial setup)

**Env vars (for initial setup — delete after saving to Firestore):**
```
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
VITE_CLOUDINARY_API_KEY=...
```

---

## Firestore Collections

| Collection | Purpose | Read | Write |
|---|---|---|---|
| `users` | Client profiles | Own doc or admin | Self (create), super_admin |
| `admins` | Staff profiles | Own doc or super_admin | Self (create), super_admin |
| `admin_secrets` | Staff passwords (reference) | super_admin only | Self (on vault signup) |
| `projects` | Client projects | Own or admin | Admin only |
| `transactions` | Wallet deposits/payments | Own or admin | Self (create), admin (approve) |
| `chats` / `conversations` | Support messages | Participants or admin | Participants |
| `user_notifications` | System notifications | Own or broadcast | Admin |
| `audit_logs` | Admin action history | super_admin | Admin |
| `system_config` | Bank details etc. | Signed-in users | super_admin |
| `platform_settings` | Vault, loading, Cloudinary, email | Public (read) | super_admin |
| `vault_alerts` | Failed vault attempt logs | super_admin | Public (gate writes on lockout) |
| `categories` / `products` | Marketplace | Public | Admin |

---

## Known Limitations / Future Work

### Email Notifications
Vault lockout alerts are logged to Firestore (`vault_alerts`) but emails are not yet sent automatically. To implement:
- **Option A**: Use [EmailJS](https://emailjs.com) (client-side, no backend needed)
- **Option B**: Firebase Cloud Function triggered on `vault_alerts` document creation

### Financial Atomicity
When a deposit is approved, the transaction status updates but the user `balance` field is not automatically incremented. A Firebase Cloud Function triggered on `transactions/{id}` update is needed. See `UPGRADE_PLAN.md` Phase 2.

### 2FA
The `tfaEnabled` field exists in the schema but 2FA is not implemented. Either build it using Firebase Multi-Factor Auth or remove the field.

---

## Route Map

```
/                          Public landing page
/login                     Client login
/signup                    Client registration
/terms                     Terms & Conditions
/company/vault             Vault gate → staff login/signup choice
/company/vault/login       Staff login
/company/vault/signup      Staff registration
/dashboard                 Client dashboard (protected)
/projects                  Client projects
/marketplace               Browse services
/cart                      Cart
/wallet                    Wallet & deposits
/support                   Chat with team
/profile                   User profile
/subscription              Subscription status
/notifications             Notifications
/admin                     Admin HQ
/admin/users               User Management
/admin/users/:userId       User detail view
/admin/chats               Messages
/admin/payments            Payment approvals
/admin/fixes               Bug fixes
/admin/projects            Operations
/admin/marketplace         Market management
/admin/broadcast           Broadcast messages
/superadmin                Super Authority dashboard
/superadmin/admins         Manage admin staff
/superadmin/audit          Audit logs
/superadmin/settings       Platform Settings ← main config page
```

---

## Key Files

```
src/
├── App.tsx                        Route definitions + loading wrapper
├── AuthContext.tsx                Auth state, roles, register/login
├── firebase.ts                    Firebase init + exports
├── lib/
│   └── platformSettings.ts        Firestore platform settings service + hooks
├── components/
│   ├── vault/
│   │   └── VaultGate.tsx          Vault PIN gate (wraps all /company/vault/* routes)
│   ├── ui/
│   │   └── LoadingScreen.tsx      App loading screen (4 effect modes)
│   └── navigation/
│       └── Sidebar.tsx            Main nav sidebar
├── pages/
│   ├── auth/
│   │   ├── AdminSignupGate.tsx    Vault landing (login/signup choice)
│   │   ├── VaultLogin.tsx         Staff login
│   │   └── VaultSignup.tsx        Staff registration (no hardcoded PIN)
│   └── superadmin/
│       ├── Dashboard.tsx          Super admin overview + bank config
│       ├── PlatformSettings.tsx   Platform Settings (vault/loading/cloudinary/email)
│       ├── ManageAdmins.tsx       Manage admin accounts
│       └── AuditLogs.tsx          System audit trail
firestore.rules                    Firestore security rules
UPGRADE_PLAN.md                    Full upgrade roadmap with all 6 phases
```

---

## Phase 1 Changes (June 2026)

### Security Fixes
- Removed hardcoded Vault PIN (`8829`) — now configurable via Platform Settings, stored as SHA-256 hash
- Removed hardcoded admin email from Firestore rules
- Moved admin password to `admin_secrets` collection — super admin read only
- Fixed Firestore rules typo: `request.auth.id` → `request.auth.uid` (was silently failing validation)
- Added `platform_settings` and `vault_alerts` Firestore rules

### New Features
- **VaultGate component** — dynamic PIN gate wrapping all vault routes
- **Platform Settings page** (`/superadmin/settings`) — vault, loading screen, Cloudinary, support email
- **Loading Screen** — 4 effect modes, custom logo, custom HTML+CSS
- **Cloudinary Settings** — configure from dashboard, live connection test
- **Support Email** — configurable, defaults to `support@durax.com`
- **Vault lockout** — 5 attempts → 15-min lock + Firestore alert
- **Super Admin personal email** — stored in profile for security notifications

### Terminology Cleanup
- "Entity Registry" → "User Management"
- "Signal Relays" → "Messages"
- "Fiscal Review" → "Payments"
- "Engine Fixes" → "Bug Fixes"
- "Command Audit" → "Audit Logs"
- "Broadcaster" → "Broadcast"
- Removed "Protocol DT-8829" from public text
- Removed hardcoded personal email from footer
- Sidebar now shows actual username + role

### Role Cleanup
- Removed `'client'` role — roles are now: `user`, `admin`, `super_admin`
- Vault registrations now set `role: 'admin'` (was incorrectly `'client'`)
