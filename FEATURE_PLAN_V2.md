# Feature Plan V2

**Date:** June 17, 2026  
**Status:** Planning → Ready for execution

---

## Feature 1 — Chat Widget Rebrand + Glow Animation

**Where:** `src/components/widget/SupportWidget.tsx`

**What to build:**
- Replace the `MessageSquare` lucide icon on the FAB with the platform logo/icon image
- Add a radiant green-to-blue CSS keyframe glow animation on the FAB button
- Animation: pulsing outer glow that cycles green → teal → blue → green (infinite)
- Logo source: reads from `platform_settings/branding` in Firestore (same doc used by landing page images feature below), falls back to the local `/WA_1776458003470.jpeg`
- Keep the existing presence dot and unread badge

**Implementation:**
- Add `@keyframes glowCycle` in Tailwind via inline style or a global CSS class
- FAB shows `<img>` of platform logo instead of icon, rounded-full, object-cover
- Glow uses `box-shadow` animation cycling through green and blue shades

---

## Feature 2 — Admin Discount Pricing System

**Where:** `src/pages/admin/Marketplace.tsx` (product add/edit form) + product cards in `src/pages/public/Store.tsx` and `src/pages/user/Marketplace.tsx`

**What to build:**

### 2a — Discount Price Entry
- In the admin product form, add an optional "Discount Price" field
- When filled: platform auto-calculates `discountPct = Math.round((1 - newPrice/originalPrice) * 100)`
- Product card shows:
  - ~~$300~~ (strikethrough original)
  - **$250** (highlighted new price)
  - `12% OFF` badge (green/orange pill)
- Firestore product doc gains: `discountPrice?: number`, `discountEndsAt?: string (ISO)`

### 2b — Countdown Timer
- Optional "Promo Ends At" date/time picker on the product form
- Product card shows a live countdown: `Offer ends in 2d 14h 30m`
- When timer expires, discount auto-hides on the frontend (no price change in Firestore needed — client-side check)

### 2c — Half-Payment / Installment Option
- Two modes:
  - **Global toggle** in Admin settings: "Allow half-payment on all products"
  - **Per-product toggle**: "Allow half-payment for this product" checkbox in product form
- When enabled on a product, checkout shows:
  - Pay 50% now → $125
  - Remaining $125 due in 14 days
- Firestore: product doc gains `halfPaymentEnabled?: boolean`
- Firestore: `platform_settings/payment` doc gains `halfPaymentGlobal: boolean`
- Order doc gains `paymentType: 'full' | 'half'`, `secondPaymentDue?: string`, `secondPaymentStatus?: 'pending' | 'paid'`
- Admin can see outstanding second payments in a new "Pending Installments" tab

**New Firestore fields on product docs:**
```
discountPrice?: number
discountEndsAt?: string
halfPaymentEnabled?: boolean
```

---

## Feature 3 — Floating Marketplace Announcements (Promo Banner System)

**Where:** New `src/components/marketplace/PromoAnnouncements.tsx` + admin config in `src/pages/admin/Marketplace.tsx`

**What to build:**
- Admin creates up to 5 announcement messages with:
  - `message: string` (text content)
  - `type: 'promo' | 'info' | 'ad'` (controls color: orange/blue/green)
  - `active: boolean`
  - `link?: string` (optional CTA link)
- Stored in Firestore: `platform_settings/announcements` → `items: AnnouncementItem[]`

**Display options (configurable by admin):**
- **Floating ticker**: Fixed strip at top or bottom of marketplace that cycles through active messages (one at a time, slides/fades every 4s)
- **Toast-style cards**: Small floating cards that pop in bottom-left, show for 6s, then next one appears

**Component behavior:**
- Loads announcements from Firestore on mount
- Rotates through active ones with smooth animation (framer-motion)
- Optional dismiss button (X) per message
- Non-intrusive: doesn't block product grid

**Admin UI:** New "Announcements" tab in Admin Marketplace page with a list editor (add/remove/toggle/reorder)

---

## Feature 4 — Google Ads Integration in Marketplace

**Where:** `src/pages/public/Store.tsx`, `src/pages/user/Marketplace.tsx`, new `src/components/marketplace/AdSlot.tsx`

**What to build:**
- A reusable `<AdSlot />` component that renders a Google AdSense unit
- Ad type: **Display ads** (image-based, no video) using `data-ad-format="auto"` with `data-full-width-responsive`
- Placement: Injected every N products in the product grid (e.g., after every 6 products)
- Superadmin can configure in Platform Settings:
  - `adsenseClientId: string` (e.g., `ca-pub-XXXXXXXXXXXXXXXX`)
  - `adsSlotId: string`
  - `adsEnabled: boolean`
  - `adsFrequency: number` (insert ad every N products, default 6)
- Stored in: `platform_settings/ads`

**Implementation:**
- Dynamically inject the AdSense `<script>` tag only when `adsEnabled = true`
- `<AdSlot>` renders `<ins class="adsbygoogle">` with configured slot/client IDs
- Calls `(adsbygoogle = window.adsbygoogle || []).push({})` on mount
- Shows nothing if `adsEnabled = false` or config is empty

**Platform Settings UI:** New "Google Ads" section in `src/pages/superadmin/PlatformSettings.tsx`

---

## Feature 5 — Superadmin "Admin Mode" Switch

**Where:** `src/AuthContext.tsx`, `src/components/navigation/SuperAdminNav.tsx` (or equivalent), `src/pages/superadmin/`

**What to build:**
- A toggle in the superadmin UI: **"Switch to Admin Mode"**
- When active, superadmin sees the full admin dashboard (same pages as a regular admin)
- A persistent indicator banner: `"Admin Mode Active — You are operating as Admin"` with a button to switch back
- Session-only (not persisted to Firestore) — just a React state flag: `isAdminMode: boolean`
- Role checks in guards: if `role === 'super_admin' && isAdminMode`, allow admin routes

**Implementation:**
- Add `adminMode: boolean` + `setAdminMode` to `AuthContext`
- Admin route guard (`AdminRoute` component) accepts superadmin in admin mode
- Floating indicator bar (top of screen, orange background) with "Exit Admin Mode" button
- No new Firebase writes required — purely frontend session state

---

## Feature 6 — Landing Page Images via Cloudinary (Superadmin)

**Where:** `src/pages/superadmin/PlatformSettings.tsx`, `src/lib/platformSettings.ts`, `src/pages/LandingPage.tsx`, `src/components/ui/Logo.tsx`

**What to build:**
- New "Branding & Images" section in Platform Settings with:
  - **Platform Logo** — upload or paste URL → used in navbar, chat widget FAB, loading screen
  - **Hero Image** — upload or paste URL → replaces `/WA_1776458039433.jpeg` on landing page
  - **Favicon URL** — optional
- Upload uses existing `uploadToCloudinary()` from `src/lib/cloudinary.ts`
- Stored in Firestore: `platform_settings/branding` → `{ logoUrl, heroImageUrl, faviconUrl }`

**Landing page reads:**
- `LandingPage.tsx` loads `platform_settings/branding` on mount
- Falls back to local files if Firestore doc doesn't exist
- `Logo.tsx` does the same — reads `logoUrl` from branding settings

**This solves the Netlify image issue** because images are served from Cloudinary CDN, not bundled in the repo.

---

## Execution Order

| # | Feature | Complexity | Depends On |
|---|---------|-----------|-----------|
| 1 | Landing page branding (Cloudinary) | Low | — |
| 2 | Chat widget glow + logo | Low | Feature 1 (for logo URL) |
| 3 | Admin mode switch | Medium | — |
| 4 | Discount pricing + timer | Medium | — |
| 5 | Half-payment installments | Medium | Feature 4 |
| 6 | Floating announcements | Medium | — |
| 7 | Google Ads integration | Low | — |

**Suggested build order:** 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## Firestore Collections / Docs Modified

| Doc | New Fields |
|-----|-----------|
| `platform_settings/branding` | `logoUrl`, `heroImageUrl`, `faviconUrl` |
| `platform_settings/announcements` | `items: AnnouncementItem[]` |
| `platform_settings/ads` | `adsenseClientId`, `adsSlotId`, `adsEnabled`, `adsFrequency` |
| `platform_settings/payment` | `halfPaymentGlobal` |
| `products/{id}` | `discountPrice`, `discountEndsAt`, `halfPaymentEnabled` |
| `orders/{id}` | `paymentType`, `secondPaymentDue`, `secondPaymentStatus` |
