# Easy Setup — Reusable SaaS Starter Template

## Overview
A fully-wired, ready-to-deploy SaaS starter that can be dropped into any new Replit project.
An agent reading this folder can install all dependencies and have a running multi-role platform in minutes.
Deployable to **Netlify** with zero extra configuration.

---

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS 4** |
| Auth + DB | **Firebase** (Auth + Firestore) |
| File Storage | **Cloudinary** |
| Animation | **Framer Motion** |
| Icons | **Lucide React** |
| Email | **EmailJS** (client) + configurable SMTP |
| Hosting | **Netlify** (`@netlify/plugin-nextjs` + `netlify/functions/`) |

---

## Features Included

### Auth
- User login + signup (with optional referral code)
- Staff/Vault login (separate page for admin accounts)
- Forgot password / reset via Firebase email
- Session management (track + revoke active sessions)

### Roles
| Role | Collection | Access |
|---|---|---|
| `user` | `users/{uid}` | Dashboard, support chat, profile, notifications |
| `admin` | `admins/{uid}` | User management, chat management, broadcast |
| `super_admin` | `admins/{uid}` | Everything + full platform configuration |

### User Pages
- Dashboard
- Support chat (open ticket → real-time messaging)
- Profile (edit avatar, name, phone)
- Notifications (real-time bell + notification list)

### Admin Pages
- Dashboard (stats)
- User management (list, view detail, ban/suspend)
- Chat management (all support threads)
- Broadcast (email all users or a group)

### Super Admin Pages
- Platform branding (name, colors, logo, favicon, tagline)
- SEO settings (meta title, description, OG image)
- Email settings (EmailJS or SMTP config, DNS guidance)
- Registration toggle (open/close signups)
- Maintenance mode (toggle + custom message)
- Admin staff management (invite, promote, remove)
- Audit logs (filter by user, action, date)

### Core Systems
- **Dynamic branding** — platform settings loaded from Firestore, injected as CSS variables at root layout
- **Real-time chat** — Firestore-powered support chat with file uploads, message editing, delete
- **In-app notifications** — bell icon, real-time Firestore listener, mark read/unread
- **Toast system** — global feedback for all actions (success, error, warning, info)
- **Audit logging** — every admin action is logged with timestamp + actor
- **Signed Cloudinary uploads** — via Netlify Function (keeps API secret server-side)
- **Mobile responsive** — all sidebars collapse to hamburger on small screens
- **Dark/light mode** — Tailwind `dark:` classes, toggle stored in localStorage
- **Custom 404 page** — branded not-found page
- **Terms + Privacy stubs** — blank legal pages with routing set up

---

## Folder Structure
```
easy-setup/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── staff/page.tsx            # Vault / staff login
│   │   └── forgot-password/page.tsx
│   ├── (user)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── support/page.tsx
│   │   ├── profile/page.tsx
│   │   └── notifications/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── users/[id]/page.tsx
│   │   ├── chats/page.tsx
│   │   └── broadcast/page.tsx
│   ├── (superadmin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── platform/page.tsx         # Branding + SEO + toggles
│   │   ├── email/page.tsx
│   │   ├── admins/page.tsx
│   │   └── audit/page.tsx
│   ├── (public)/
│   │   ├── terms/page.tsx
│   │   └── privacy/page.tsx
│   ├── api/
│   │   └── sign-cloudinary/route.ts  # Next.js API route (Netlify converts this)
│   ├── layout.tsx                    # Root layout — loads platform CSS vars
│   ├── page.tsx                      # Landing page
│   ├── not-found.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx                 # + ToastContext
│   │   ├── Logo.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── NotificationBell.tsx
│   ├── navigation/
│   │   ├── UserSidebar.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── SuperAdminSidebar.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── ChatList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   └── guards/
│       ├── UserGuard.tsx
│       ├── AdminGuard.tsx
│       └── SuperAdminGuard.tsx
├── lib/
│   ├── firebase.ts
│   ├── authService.ts
│   ├── platformSettings.ts
│   ├── chatService.ts
│   ├── cloudinaryService.ts
│   ├── emailService.ts
│   ├── auditService.ts
│   ├── sessionService.ts
│   └── notificationService.ts
├── contexts/
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── types/
│   └── index.ts
├── netlify/
│   └── functions/
│       └── sign-cloudinary.ts        # Netlify Function (fallback/alternative)
├── netlify.toml                      # Netlify deploy config + Next.js plugin
├── firestore.rules
├── .env.example
├── package.json
├── next.config.ts
├── postcss.config.ts                 # Tailwind 4 for Next.js
├── tsconfig.json
└── README.md                         # Agent-readable setup instructions
```

---

## Netlify Deployment
`netlify.toml` includes:
- `@netlify/plugin-nextjs` for full Next.js support
- `netlify/functions/sign-cloudinary.ts` as the Cloudinary signing endpoint
- Redirect rules for SPA fallback
- `NODE_VERSION = "20"` pinned

---

## Firestore Collections
```
users/                — user profiles (role: 'user')
admins/               — admin + super admin profiles
sessions/             — active login sessions
chats/                — support chat threads
messages/             — subcollection: chats/{id}/messages
notifications/        — user_notifications/{uid}/items
platform_settings/    — branding, email, cloudinary, seo, toggles
audit_logs/           — admin action history
referrals/            — referral tracking
```

---

## Environment Variables (.env.example)
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

## Build Order (execution sequence)
1. Config files (package.json, next.config.ts, postcss, tsconfig, netlify.toml, .env.example)
2. Types
3. Firebase init + all service libs
4. Contexts (AuthContext, ToastContext)
5. UI components
6. Guards + Navigation sidebars
7. Chat components
8. Root layout + globals.css + landing page + 404
9. Auth pages (login, signup, staff, forgot-password)
10. User pages
11. Admin pages
12. Super admin pages
13. API route (sign-cloudinary)
14. Netlify function (sign-cloudinary)
15. Firestore rules
16. README.md
17. Zip → easy-setup.zip
