# Easy Setup — SaaS Starter Template

A production-ready multi-role SaaS starter built with **Next.js 15 + Tailwind CSS 4 + Firebase + Cloudinary**.
Drop this folder into a new Replit project and you have a fully wired platform in minutes.

---

## Stack
- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS 4**
- **Firebase** Auth + Firestore
- **Cloudinary** file uploads
- **Framer Motion** animations
- **Netlify** deployment (plugin-nextjs + Functions)

---

## ⚡ Quick Start (for agents and developers)

### 1. Install dependencies
```bash
npm install
```

> ⚠️ IMPORTANT for Replit environments: After running `npm install`, ALWAYS run this before committing:
> ```bash
> sed -i 's|http://package-firewall.replit.local/npm|https://registry.npmjs.org|g' package-lock.json
> ```
> Replit injects its internal registry into the lockfile. This breaks Netlify builds.

### 2. Set up Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database** (start in test mode, then apply `firestore.rules`)
5. Go to **Project Settings → Your apps → Web** → copy config values

### 3. Set up Cloudinary
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to **Settings → Upload → Upload presets → Add preset** (set to unsigned)
3. Copy Cloud name, API key, API secret from dashboard

### 4. Configure environment variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

For Netlify: add these same variables in **Site settings → Environment variables**.

### 5. Apply Firestore security rules
In your Firebase console → Firestore → Rules, paste the contents of `firestore.rules`.

### 6. Create your first Super Admin
In Firestore, manually create a document:
- **Collection:** `admins`
- **Document ID:** your Firebase Auth UID (find it in Authentication → Users after registering)
- **Fields:**
  ```json
  {
    "uid": "YOUR_FIREBASE_UID",
    "email": "your@email.com",
    "username": "Super Admin",
    "role": "super_admin",
    "status": "active",
    "createdAt": (server timestamp)
  }
  ```

### 7. Run locally
```bash
npm run dev
# Opens on http://localhost:5000
```

---

## Routing Overview

| Path | Who sees it |
|---|---|
| `/` | Public — landing page |
| `/login` | User login |
| `/signup` | User registration |
| `/staff` | Staff/Admin vault login |
| `/forgot-password` | Password reset |
| `/dashboard` | User (protected) |
| `/support` | User — support chat |
| `/profile` | User — edit profile |
| `/notifications` | User — notification list |
| `/admin/dashboard` | Admin + Super Admin |
| `/admin/users` | Admin — manage users |
| `/admin/chats` | Admin — support chat management |
| `/admin/broadcast` | Admin — send announcements |
| `/superadmin/dashboard` | Super Admin only |
| `/superadmin/platform` | Branding, SEO, toggles |
| `/superadmin/email` | Email provider config |
| `/superadmin/admins` | Admin staff management |
| `/superadmin/audit` | Audit logs |
| `/terms` | Public — Terms of Service |
| `/privacy` | Public — Privacy Policy |

---

## Deployment (Netlify)

1. Push to GitHub
2. Connect repo to Netlify
3. Add all environment variables from `.env.example`
4. Deploy — `netlify.toml` handles everything via `@netlify/plugin-nextjs`

> **Lockfile warning:** See Quick Start step 1 above. Always patch the lockfile before pushing if you've run `npm install` inside Replit.

---

## Customising for Your Project

1. **Branding** — log in as Super Admin → `/superadmin/platform`
2. **Adding pages** — create new files in `app/(user)/`, `app/(admin)/`, or `app/(superadmin)/`
3. **Adding services** — add to `lib/` following the existing patterns
4. **Adding nav items** — update `components/navigation/UserSidebar.tsx` etc.
5. **Extending types** — add to `types/index.ts`

---

## What to build on top
This starter intentionally leaves out project-specific features:
- **Payments** → add Stripe or your preferred provider
- **Marketplace** → add product collections in Firestore
- **AI features** → add your AI provider of choice
- **Analytics** → add Firebase Analytics or similar

---

## Firestore Collections
| Collection | Purpose |
|---|---|
| `users` | User profiles (`role: 'user'`) |
| `admins` | Admin/super admin profiles |
| `sessions` | Active login sessions |
| `chats` | Support chat threads |
| `chats/{id}/messages` | Messages subcollection |
| `user_notifications/{uid}/items` | Per-user notifications |
| `platform_settings` | All platform config (branding, email, cloudinary) |
| `audit_logs` | Admin action history |
| `referrals` | Referral tracking |
