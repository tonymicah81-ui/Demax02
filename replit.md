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

## ⚠️ CRITICAL — npm Registry Warning (read before touching dependencies)

Replit injects an internal registry (`package-firewall.replit.local`) into npm at the system level. This overrides `.npmrc` and env vars. Every time `npm install` runs inside Replit, `package-lock.json` gets URLs rewritten to this internal host — which **does not exist outside Replit** and breaks every Netlify deployment with `ENOTFOUND` errors.

**Rule: never commit `package-lock.json` directly after running `npm install` in Replit.**

After installing any package, always run this before committing:
```bash
sed -i 's|http://package-firewall.replit.local/npm|https://registry.npmjs.org|g' package-lock.json
```

Then verify it's clean:
```bash
grep -c "replit.local" package-lock.json
# must output: 0
```

Only commit once the count is 0.

**Why this matters:** The project deploys to Netlify. The lockfile is committed to GitHub. Netlify clones the repo and runs `npm install` — if the lockfile has `replit.local` URLs, the install fails completely and the site cannot deploy.
