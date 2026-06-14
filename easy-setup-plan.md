# Easy Setup — Reusable SaaS Starter Template

## Overview
A fully-wired, ready-to-deploy SaaS starter that can be dropped into any new Replit project.
An agent reading this folder can install all dependencies and have a running multi-role platform in minutes.

---

## Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR, API routes built-in, better SEO, widely deployable |
| Language | **TypeScript** | Full type safety |
| Styling | **Tailwind CSS 4** | Same as current project |
| Auth + DB | **Firebase** (Auth + Firestore) | Same as current project, no migration needed |
| File Storage | **Cloudinary** | Same signed-upload pattern |
| Animation | **Framer Motion** | Consistent UI feel |
| Icons | **Lucide React** | Same icon set |
| Email | **EmailJS** (client) + configurable SMTP (server) | Super admin can switch provider |
| Chat | **Firestore real-time** | Same real-time pattern as current project |

---

## Folder Structure
```
easy-setup/
├── app/                              # Next.js App Router
│   ├── (public)/
│   │   └── page.tsx                  # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx            # User login
│   │   ├── signup/page.tsx           # User registration
│   │   └── staff/page.tsx            # Admin/Staff vault login
│   ├── (user)/
│   │   ├── layout.tsx                # User shell + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── support/page.tsx          # Support chat
│   │   └── profile/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                # Admin shell + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── chats/page.tsx            # Live support chat management
│   │   └── broadcast/page.tsx        # Email broadcast
│   ├── (superadmin)/
│   │   ├── layout.tsx                # Super admin shell
│   │   ├── dashboard/page.tsx
│   │   ├── platform/page.tsx         # Branding settings
│   │   ├── email/page.tsx            # Email provider settings
│   │   ├── admins/page.tsx           # Admin staff management
│   │   └── audit/page.tsx            # Audit logs
│   ├── api/
│   │   └── sign-cloudinary/route.ts  # Signed upload endpoint (replaces Netlify Function)
│   ├── layout.tsx                    # Root layout (loads platform settings)
│   └── globals.css
├── components/
│   ├── ui/                           # Button, Input, Badge, Modal, etc.
│   ├── navigation/
│   │   ├── UserSidebar.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── SuperAdminSidebar.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── ChatList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx             # With file upload
│   └── guards/
│       ├── UserGuard.tsx
│       ├── AdminGuard.tsx
│       └── SuperAdminGuard.tsx
├── lib/
│   ├── firebase.ts                   # Firebase init
│   ├── auth.ts                       # Register, login, logout, role detection
│   ├── chatService.ts                # Firestore real-time chat
│   ├── cloudinary.ts                 # Signed upload via /api/sign-cloudinary
│   ├── emailService.ts               # Configurable email sending
│   ├── platformSettings.ts           # Load/save from Firestore
│   ├── auditService.ts               # Audit log writes
│   └── sessionService.ts             # Session validation
├── contexts/
│   └── AuthContext.tsx               # Global auth + role state
├── types/
│   └── index.ts                      # Shared TypeScript types
├── firestore.rules                   # Security rules for all collections
├── .env.example                      # All required env vars documented
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md                         # Agent-readable setup instructions
```

---

## Pages Detail

### Landing Page `/`
- Platform name + logo (loaded dynamically from Firestore)
- Hero section with tagline + CTA buttons (Login / Sign Up)
- Features section (3–4 cards)
- Footer
- Fully customizable from Super Admin → Platform Settings

### Auth Pages
**`/login`**
- Email + password
- Link to signup
- Link to staff login

**`/signup`**
- Username, phone, email, password, confirm password
- Optional referral code field
- Redirects to user dashboard on success

**`/staff`** (Vault Login)
- Email + password for admin/super admin accounts
- Same vault logic: separate from user login

---

## Role System

| Role | Collection | Access |
|---|---|---|
| `user` | `users/{uid}` | User dashboard, support chat, profile |
| `admin` | `admins/{uid}` | Admin panel, user management, chat |
| `super_admin` | `admins/{uid}` | Everything + platform settings |

Role is detected in `AuthContext` by checking both `users` and `admins` Firestore collections on login.

---

## Core Systems

### 1. Platform Settings (Super Admin → Platform)
Stored in `Firestore: platform_settings/branding`
- Platform name
- Primary color (hex)
- Secondary color (hex)
- Logo URL (Cloudinary)
- Favicon URL (Cloudinary)
- Platform tagline

Applied dynamically in root `layout.tsx` via CSS variables injected into `<head>`.

### 2. Chat System
- Same Firestore real-time pattern as current project
- Users open a support ticket → creates a chat thread
- Admins see all open chats, can reply
- Messages support text + file attachments (Cloudinary)
- Deleted messages hidden from user view
- Edit message inline

### 3. Email System (Super Admin → Email Settings)
Stored in `Firestore: platform_settings/email`
- Provider choice: EmailJS / SMTP
- EmailJS: service ID, template ID, public key
- SMTP: host, port, user, pass (stored encrypted in Firestore)
- DNS info section (for custom domain email setup guidance)
- Test send button

### 4. File Uploads (Cloudinary)
- Signed upload via Next.js API route `/api/sign-cloudinary`
- Config stored in `Firestore: platform_settings/cloudinary` with env fallback
- Client-side upload with progress

### 5. Audit Logs
- Every admin/super admin action writes to `Firestore: audit_logs`
- Super admin can filter by user, action type, date range

---

## Firestore Collections
```
users/              — user profiles
admins/             — admin + super admin profiles
sessions/           — active login sessions
chats/              — support chat threads
messages/           — chat messages (subcollection under chats)
platform_settings/  — branding, email, cloudinary config
audit_logs/         — admin action history
referrals/          — referral tracking
```

---

## Environment Variables (`.env.example`)
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## README.md (Agent Instructions)
The README will include:
- How to install: `npm install`
- How to set up Firebase (create project, enable Auth, copy config)
- How to set up Cloudinary (create account, get keys)
- How to set the first super admin (Firestore manual doc)
- How to run: `npm run dev`
- Deployment: Vercel one-click (Next.js native)

---

## What Is NOT Included (intentionally lean)
- Payment/wallet system (project-specific)
- Marketplace (project-specific)
- Any AI features (project-specific)
- Complex project management (project-specific)

The template covers **auth, roles, chat, email, branding, file uploads** — the foundation every SaaS app needs. Everything else gets built on top.

---

## Delivery
Final output: `easy-setup.zip` downloadable from Super Admin → Platform Settings → "Download Starter Template"
(Or simply available as a zip in the project files)

---

## Build Order
1. `package.json` + `next.config.ts` + `tailwind.config.ts` + `tsconfig.json`
2. `.env.example` + `firestore.rules`
3. Firebase init + AuthContext
4. UI components (Button, Input, Badge, Modal)
5. Platform settings service + root layout (CSS variables)
6. Auth pages (login, signup, staff)
7. Guards + navigation (sidebars)
8. User pages (dashboard, support chat, profile)
9. Admin pages (dashboard, users, chats, broadcast)
10. Super admin pages (platform, email, admins, audit)
11. Chat system (full)
12. Email system
13. Cloudinary upload
14. Landing page
15. README.md
16. Zip into `easy-setup.zip`
