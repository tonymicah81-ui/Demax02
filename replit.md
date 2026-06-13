# Durex Team Platform

A multi-role SaaS portal for web agencies to manage clients, projects, marketplace assets, and staff.

## Tech Stack
- **Frontend**: React 19 + Vite 6 + TypeScript
- **Styling**: Tailwind CSS 4
- **Backend/Auth/Database**: Firebase (Auth + Firestore)
- **File Storage**: Cloudinary
- **Charts**: Recharts + D3
- **Animations**: Framer Motion

## Running the App
```
npm run dev
```
Runs on port 5000.

## Project Structure
- `src/pages/` — Route pages grouped by role: `auth/`, `user/`, `admin/`, `superadmin/`
- `src/components/` — Shared UI components, navigation, guards, vault
- `src/lib/` — Service modules (chat, audit, cloudinary, session, platform settings)
- `src/firebase.ts` — Firebase initialization
- `src/AuthContext.tsx` — Global auth state
- `firebase-applet-config.json` — Firebase project config

## Roles
- **User** — Client dashboard, projects, marketplace, wallet, support
- **Admin** — User management, chat, payments, projects
- **Super Admin** — Platform settings, audit logs, admin staff management

## Environment Variables / Secrets
- `GEMINI_API_KEY` — For Gemini AI features (set in Replit Secrets)
- `VITE_CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` — Cloudinary upload preset
- `VITE_CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret (server-side only)

## User Preferences
- Keep Firebase as the auth/database layer (not replacing with Replit Auth/DB)
