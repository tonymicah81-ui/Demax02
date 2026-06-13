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

**Total: ~1 full landing page rebuild. All in `LandingPage.tsx` + `PublicLayout.tsx`.**

---

## Files Modified

- `src/pages/LandingPage.tsx` — full rebuild
- `src/pages/public/PublicLayout.tsx` — mobile menu added
