# Durex Team — Landing Page & Public Pages Redesign Plan

**Created:** June 13, 2026  
**Goal:** Turn the landing page into a high-converting advertising surface that clearly communicates every service, explains pricing logic, and works perfectly on every screen size.

---

## What We're Fixing / Upgrading

| Problem | Fix |
|---|---|
| No mobile menu | Hamburger menu with animated slide-in drawer |
| Missing services: bots, subscriptions, backend | Dedicated sections for each service type |
| No pricing comparison | Price vs standard agency comparison section |
| No scroll-triggered animations | Per-section entrance animations with stagger |
| PublicLayout has no mobile menu either | Full mobile nav in the shared layout |
| Footer is too minimal | Expanded footer with service links + social |
| No testimonials / social proof | Stats bar + trust indicators |
| No CTA per service | Each service card has its own call-to-action |

---

## Phases

---

### Phase 1 — Navigation Overhaul (Both LandingPage + PublicLayout)

**What changes:**
- Add hamburger button visible only on mobile/tablet (`md:hidden`)
- Animated slide-in mobile drawer (Framer Motion `x: -300 → 0`) with overlay backdrop
- Drawer contains: all nav links, Login + Signup buttons, theme toggle, cart count
- Close drawer on route change or backdrop click
- Smooth underline hover effect on desktop nav links
- Sticky nav gets a subtle shadow on scroll (`scrollY > 10`)

**Files:**
- `src/pages/LandingPage.tsx` — add mobile menu state + drawer
- `src/pages/public/PublicLayout.tsx` — add mobile menu state + drawer

---

### Phase 2 — Hero Section Upgrade

**What changes:**
- Animated badge rotates through 3 taglines: "Serverless Websites", "Telegram Bots", "Subscription Services"
- Two CTA buttons: "Browse Store" + "View Services" (scrolls to services section)
- Add a floating stats strip below hero: `500+ Sites Delivered · Starting $60 · 3 Service Types · 24/7 Support`
- Stats strip animates in with stagger on page load
- Hero image gets parallax scroll effect (subtle `y` movement as user scrolls)
- Mobile: single column, image below text, smaller heading

---

### Phase 3 — Services Showcase Section (NEW)

**What changes:**
Three large service cards, each explaining what it is, who it's for, and what it costs:

#### Card 1 — Serverless / No-Backend Websites
- **Icon:** Cloud + Zap
- **Headline:** "Serverless Websites — Speed Without the Cost"
- **Body:** Firebase/Supabase-powered sites. No monthly server bill. Perfect for portfolios, landing pages, small businesses, schools, churches. Starting **$60**.
- **Why cheaper:** No server to maintain. We use cloud functions + CDN delivery — 70% less infrastructure cost passed directly to you.
- **CTA:** "See Serverless Plans →"

#### Card 2 — Full-Stack / Backend Websites
- **Icon:** Server + Database  
- **Headline:** "Full Backend Systems — For Serious Business"
- **Body:** Node.js, Express, PostgreSQL, real-time dashboards, admin panels, multi-role SaaS. For e-commerce platforms, booking systems, enterprise tools. Custom pricing.
- **Why it's still competitive:** We build modular — reuse tested components instead of starting from scratch every time.
- **CTA:** "Request a Quote →" (links to `/signup`)

#### Card 3 — Subscription Services (Email + Bot)
- **Icon:** Repeat + Mail + Bot
- **Headline:** "Subscribe & Grow — Platform Services"
- **Body:** Add email infrastructure, contact management, or a Telegram bot to your business without hiring a developer. Monthly plans. Cancel anytime.
- **CTA:** "View Plans →" (links to `/store`)

**Layout:** 3-col on desktop, stacked on mobile. Each card has a colored top border, icon, stats chip, and hover lift effect.

---

### Phase 4 — Telegram Bot Section (NEW)

**What changes:**
Dedicated standalone section just for the bot service. This needs its own spotlight because it's a unique offering.

- **Headline:** "Your Business, Automated — Telegram Bot Service"
- **Sub:** Two ways to get a bot:
  1. **We build it for you** — you describe what you need, we configure and deploy
  2. **Self-service subscription** — subscribe, get access to the bot dashboard, configure your own bot
- Feature list with icons:
  - Auto-reply & keyword triggers
  - Customer greeting messages  
  - Link to your platform account
  - Webhook support
  - Admin notification relay
- Visual: animated mock Telegram chat UI showing a bot in action (pure CSS/HTML, no image needed)
- **CTA:** "Get a Bot →" → `/signup`

---

### Phase 5 — Pricing Transparency Section (Replaces "Efficiency Engine")

**What changes:**
Current section is too technical ("decentralized cloud logic", code snippet). Replace with a clear, honest side-by-side comparison table.

**Layout:** Split comparison — "Standard Agency" vs "Durex Team"

| What You Need | Standard Agency | Durex Team |
|---|---|---|
| Simple Business Website | $500 – $2,000 | From **$60** |
| E-Commerce Store | $2,000 – $8,000 | From **$200** |
| Custom Web App | $5,000 – $20,000 | Custom quote |
| Monthly Hosting (server) | $50 – $300/mo | Included or $0* |
| Email Infrastructure | $30 – $100/mo | From **$15/mo** |
| Telegram Bot | $300 – $1,000 setup | From **$20/mo** |

*Why the difference? — 3 bullet points with icons:*
1. **No server overhead** — serverless architecture means no dedicated machine to pay for
2. **Modular builds** — we reuse tested components instead of starting from scratch
3. **Firebase as a backend** — industry-grade infrastructure at a fraction of traditional costs

Keep the code terminal visual as a small accent, not the main focus.

---

### Phase 6 — Subscriptions Highlight Section (NEW)

**What changes:**
A clean 3-tier subscription preview (Basic / Pro / Enterprise) pulled from Firestore `subscription_models`, or shown as static fallback cards.

- Cards: monthly price, feature list, "Get Started" CTA
- Most popular badge on Pro
- Note: "All plans managed from your dashboard. Cancel anytime."
- Section headline: "Recurring Services — Pay Monthly, Cancel Anytime"

---

### Phase 7 — Trust / Social Proof Strip

**What changes:**
Between sections, add a horizontal scrolling marquee strip (infinite scroll animation):
`⚡ Serverless Architecture · 🔒 Firebase Security · 🤖 Telegram Bots · 📧 Email Infrastructure · 🛒 Marketplace Assets · ⚡ Serverless Architecture · ...`

Also add a stats section with 4 counters (animate count up on scroll into view):
- `500+` — Sites Delivered
- `$60` — Starting Price  
- `3` — Service Types
- `100%` — Firebase Powered

---

### Phase 8 — Featured Products (Keep + Improve)

**What changes:**
- Move closer to the bottom (after services explanation)
- Show product image properly (larger card, full-width image on top)
- Add a category filter row (pill buttons) above the grid
- Empty state: show 6 static placeholder cards with service category icons
- "Browse Full Store" CTA at bottom stays

---

### Phase 9 — Footer Expansion

**What changes:**
4-column footer:
1. **Brand** — Logo, tagline, support email
2. **Services** — Serverless, Backend, Email, Bot, Marketplace
3. **Platform** — Login, Sign Up, Store, Terms, Vault (faded)
4. **Company** — About (placeholder), Security, Audit (placeholder)

Bottom bar: copyright + "Secured by Firebase GCP" + theme toggle

---

## Scroll Animation Strategy

Every section uses this pattern:
```
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: "-100px" }}
transition={{ duration: 0.7, ease: "easeOut" }}
```

For grids, children stagger with `delay: i * 0.08`.

For the hero stats strip: `delay: i * 0.15` after a `0.6s` base delay.

The infinite marquee uses pure CSS `@keyframes marquee` — no JS needed.

---

## Mobile Breakpoint Strategy

| Element | Mobile (< 768px) | Tablet (768–1024px) | Desktop (> 1024px) |
|---|---|---|---|
| Nav | Logo + Cart + Hamburger | Logo + Links + Cart | Full nav |
| Hero | Single col, img below | Single col | 2-col grid |
| Services | Stacked full-width | 2-col grid | 3-col grid |
| Comparison table | Scrollable horizontal | Full | Full |
| Subscription cards | Stacked | 2-col | 3-col |
| Footer | Stacked 1-col | 2-col | 4-col |

---

## Execution Order

| Phase | Name | Effort |
|---|---|---|
| 1 | Navigation (mobile menu) | Small |
| 2 | Hero upgrade | Small |
| 3 | Services showcase | Medium |
| 4 | Telegram bot section | Medium |
| 5 | Pricing comparison | Medium |
| 6 | Subscriptions highlight | Small |
| 7 | Trust strip + stats counters | Small |
| 8 | Featured products improvement | Small |
| 9 | Footer expansion | Small |

---

### Phase 10 — Store / Marketplace Mobile Fix + Visual Upgrade

**What's broken now:**
- Categories sidebar is desktop-only — completely disappears on mobile with no replacement
- Search bar is too wide on small screens
- No way to filter or browse by category on a phone
- Product grid has no entrance animations on filter change

**What changes:**

**Mobile filter system:**
- On mobile (`< lg`): hide the sidebar entirely
- Replace with a horizontal scrollable pill row at the top: `[All] [Websites] [E-Commerce] [Bots] [Templates]...`
- Active pill gets filled accent color
- Sub-categories appear as a second pill row below when a category is selected
- Smooth `AnimatePresence` transition when sub-row appears/disappears

**Search bar:**
- On mobile: full-width row above the category pills
- Expand/collapse animation when focused

**Product grid:**
- Add `AnimatePresence` so cards animate out/in when filter changes (not just on load)
- Add a `layoutId` per product so they smoothly reposition on filter

**Store header:**
- On mobile: stack the title and search/cart button vertically
- Cart count badge stays visible at all times (move to top-right corner on mobile)

**Empty state:**
- Replace the simple opacity-30 div with a proper illustrated empty state — icon, heading, "Clear filters" button

**Files:**
- `src/pages/public/Store.tsx` — mobile filters + animation improvements

---

### Phase 11 — Terms & Legal Page Full Rebuild

**What's broken now:**
- `h-screen overflow-hidden` layout completely breaks on mobile (content is cut off, can't scroll)
- Sidebar navigation is desktop-only — no mobile fallback
- Header links (`Marketplace`, `Builds`, `Support`) are dead `<span>` tags
- Only ONE section of content is actually written — all others are empty when clicked
- No dark mode support
- Compliance ID `DT-8829-LEG` contains the old hardcoded PIN number — must be replaced
- "I Accept Terms" and "Download PDF" buttons do nothing

**What changes:**

**Layout fix:**
- Remove `h-screen overflow-hidden` — let the page scroll naturally
- Integrate into the standard `PublicLayout` (shared nav with mobile menu) — remove the custom header
- Desktop: keep the sidebar + main content side-by-side
- Mobile: sidebar becomes a sticky top accordion/tab row that collapses sections inline

**Navigation:**
- Replace dead `<span>` links with real `<Link>` components using react-router-dom
- Header replaced entirely by `PublicLayout` nav (consistent with Store page)

**Content — fill all 6 sections properly:**
1. **Introduction** — what Durex Team is, who the agreement is between, effective date
2. **Service Level Agreement** — uptime expectations, support response times, what "delivered" means
3. **Liability & Responsibility** — keep existing content, clean up language, remove old compliance ID
4. **Payments & Rates** — starting prices ($60), subscription billing, refund window (7 days), rate change notice (30 days)
5. **Multi-Tenant Usage** — what multi-tenant means, reseller rules, data isolation guarantee
6. **Privacy Policy** — data collected, Firebase/Cloudinary processors, no data selling, contact for deletion

**New compliance ID:** `DT-LEG-2026` (removes the old PIN reference)

**Dark mode:** Full dark mode support using existing `dark:` Tailwind classes

**Buttons:**
- "Back to Home" replaces "I Accept Terms" (which has no function)
- "Print Page" replaces "Download PDF" — uses `window.print()` with `@media print` styles

**Mobile accordion:**
- Each section becomes an expandable item with a chevron toggle
- Smooth height animation using Framer Motion `AnimatePresence`
- Active section highlighted

**Files:**
- `src/pages/TermsAndConditions.tsx` — full rebuild

---

## Updated Execution Order (All 11 Phases)

| Phase | Name | Effort | File |
|---|---|---|---|
| 1 | Navigation — mobile menu | Small | `LandingPage.tsx` + `PublicLayout.tsx` |
| 2 | Hero upgrade | Small | `LandingPage.tsx` |
| 3 | Services showcase | Medium | `LandingPage.tsx` |
| 4 | Telegram bot section | Medium | `LandingPage.tsx` |
| 5 | Pricing comparison | Medium | `LandingPage.tsx` |
| 6 | Subscriptions preview | Small | `LandingPage.tsx` |
| 7 | Trust strip + stats | Small | `LandingPage.tsx` |
| 8 | Featured products | Small | `LandingPage.tsx` |
| 9 | Footer expansion | Small | `LandingPage.tsx` |
| 10 | Store mobile fix + animations | Medium | `Store.tsx` |
| 11 | Terms & Legal rebuild | Medium | `TermsAndConditions.tsx` |

**Total: 3 files fully rebuilt. All public-facing pages covered.**

---

## Files Modified

- `src/pages/LandingPage.tsx` — full rebuild (Phases 1–9)
- `src/pages/public/PublicLayout.tsx` — mobile menu (Phase 1)
- `src/pages/public/Store.tsx` — mobile filters + animations (Phase 10)
- `src/pages/TermsAndConditions.tsx` — full rebuild (Phase 11)
