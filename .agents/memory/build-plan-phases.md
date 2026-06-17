---
name: Build Plan Phases
description: Architecture decisions made when completing all 12 phases of BUILD_PLAN.md
---

## Visitor Chat (T008)
- Visitor ID stored in `localStorage` key `dt_vid` — format `v_{timestamp}_{random}`
- Widget started state stored in `dt_widget_started` JSON `{name, email}`
- Firestore collections: `visitor_conversations/{visitorId}`, `visitor_messages` (flat, filtered by visitorId)
- Admin presence stored at `presence/{adminUid}` — widget subscribes to any doc with `online: true`
- `SupportWidget` source prop passed as `"landing"` / `"store"` for tracking

## Multi-Category Tags (T007)
- Products have `categoryId` (primary, string) + `tags: string[]` (additional category IDs)
- Filter logic: `!selectedCategory || p.categoryId === selectedCategory || (p.tags||[]).includes(selectedCategory)`
- Admin product form shows category toggle buttons (excluded: primary category itself)

## User Notes / Notepad (T011)
- Subcollection path: `user_notes/{userId}/notes/{noteId}`
- Fields: `text, authorId, authorName, pinned, createdAt, updatedAt`
- `UserNotepad` component added as "Notes" tab in admin/UserDetails.tsx

## Platform Notification Bot (T009)
- Config stored at `platform_settings/platform_bot` Firestore doc
- Fields: `token, chatId, enabled, events: {newUser, newDeposit, newOrder, newFix, newVisitorChat}`
- PlatformBotPanel component inline in PlatformSettings.tsx (not extracted to lib)
- Tab added as "Platform Bot" in superadmin/PlatformSettings.tsx

## Visitor Intelligence (T012)
- Stored at `visitor_intelligence/{visitorId}`
- Geo via `https://ipapi.co/json/` (non-critical, silently fails, 3s timeout)
- Tracks: browser, OS, device, language, referrer, country, city, IP, pagesVisited[], firstSeen, lastSeen, totalVisits, isReturning
- Called on LandingPage and Store mount with `trackVisitor("landing"|"store")`

## Admin Chats — Visitor Tab (T008 admin side)
- Two tabs: "Client Messages" (existing) and "Visitor Chats" (new)
- Admin presence is set ON when Chats page is mounted, cleared on unmount
- Visitor reply via `sendAdminReplyToVisitor(visitorId, text, adminId, adminName)`
- Admin can close a visitor conversation (sets status: "closed")

## Pre-existing TypeScript errors (not introduced by our work)
- LandingPage.tsx: motion/react whileInView prop type errors (pre-existing)
- Profile.tsx: photoURL property (pre-existing)
- These are non-blocking — Vite compiles fine, only tsc strict check surfaces them
