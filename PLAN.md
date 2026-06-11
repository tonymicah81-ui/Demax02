# Durex Team Platform - Project Plan

## Phase 1: Foundation & Setup
- [x] Update metadata.json
- [x] Setup Firebase Auth & Firestore using `set_up_firebase`
- [x] Install dependencies: `firebase`, `lucide-react`, `motion`, `clsx`, `tailwind-merge`
- [x] Configure Tailwind theme (Durex Team colors: Blue `#3b82f6`, Green `#22c55e`)
- [x] Implement Light/Dark mode with ThemeContext
- [x] Rename `votes` pathway and collection to `vault`

## Phase 2: Design System & Core Layouts
- [x] Implement Light/Dark mode with Tailwind
- [ ] Create Global Layout: Sidebar, Topbar, Main Content Area
- [ ] Design Technical Dashboard UI (Recipe 1) for Admins
- [x] Design Fintech-Grade SaaS Landing Page for Durex Team

## Phase 3: Auth & RBAC
- [x] Admin Signup Flow (Vault/PIN system check)
- [x] User Signup/Login (with Terms Checkbox)
- [ ] Middleware-like role protection (Client, Admin, Super Admin)
- [ ] Profile/Settings page

## Phase 4: Core Features
- [ ] **Chat System**: Real-time messaging between Users and Admins
- [ ] **Issue Tracking**: Users report problems, Admins resolve them
- [ ] **Notifications**: Real-time alerts for messages/updates
- [ ] **Project Management**: User projects list with status tracking
- [ ] **Marketplace**: Website templates/services showcase

## Phase 5: External Storage & Analytics
- [ ] File metadata handling (URLs only)
- [ ] Basic Analytics Tracker (Visitor logs)
- [ ] Dashboard charts for analytics

## Phase 6: Payment & Subscriptions
- [ ] Bank Transfer Proof Upload (Manual)
- [ ] Admin approval flow for payments
- [ ] Subscription status tracking

## Phase 7: Polish & Legal
- [ ] Terms and Conditions page
- [ ] Responsive design check
- [ ] Deploy Security Rules

---

## Technical Details
- **Tech Stack**: React 19, Vite, Tailwind CSS, Firebase
- **Primary Colors**: 
  - Green: `#22c55e` (approx)
  - Blue: `#3b82f6` (approx)
- **Firebase Collections**: `users`, `admins`, `votes`, `chats`, `notifications`, `issues`, `files`, `payments`, `subscriptions`, `visitors`
