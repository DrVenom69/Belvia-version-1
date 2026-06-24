# 🔍 Belvia Version 1 — Complete Project Audit (Updated)

> **Audit Date:** June 24, 2026
> **Previous Audit:** June 17, 2026
> **Method:** Direct codebase inspection — zero assumptions, every claim is traced to a specific file and line.
> **Scope:** All source files under `g:\Antigravity Projects\Belvia version 1\`
> **Launch Readiness Score:** **92 / 100** (Upgraded from 87. Stale customer session P0 bug is resolved, profile name metadata is synchronized with Supabase, Google Sign-in is integrated, and the demo quick sign-in button is gated. Remaining gaps are the unlinked 3D hero centerpiece and missing router translate transitions.)

---

## 🕒 RECENT CHANGES & DELTA ANALYSIS (June 17 → June 24)

### ✅ Fixed: Admin Order Status Updates (Critical Regression Resolved)
- **Previous Status:** ❌ BLOCKED — SellerHub was POSTing to the removed `/api/save-orders` endpoint, causing 404 errors.
- **Current Reality:** [SellerHub.tsx:791](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/SellerHub.tsx#L791) now correctly calls `POST /api/update-order-status`. The endpoint exists on [server.ts:2578](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts#L2578) and is properly guarded by `requireAdminAuth`.

### ✅ New: Browser Push Notification System (Full-Stack)
- **Service Worker** ([public/sw.js](file:///g:/Antigravity%20Projects/Belvia%20version%201/public/sw.js)): Handles `push`, `notificationclick`, and `pushsubscriptionchange` events. Supports order deep-links and vibration patterns on Android.
- **React Hook** ([src/hooks/usePushNotifications.ts](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/hooks/usePushNotifications.ts)): Manages permission state, subscription lifecycle, VAPID key setup, and server registration/deregistration via `/api/push/subscribe` and `/api/push/unsubscribe`.
- **Supabase Schema** ([supabase_push_subscriptions_migration.sql](file:///g:/Antigravity%20Projects/Belvia%20version%201/supabase_push_subscriptions_migration.sql)): `push_subscriptions` table stores `endpoint`, `p256dh`, `auth_key`, `phone`, `email`, `user_agent`, `is_active`, and timestamps.
- **Server Endpoints** ([server.ts](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts)):
  - `POST /api/push/subscribe` (public) — registers subscription.
  - `POST /api/push/unsubscribe` (public) — deactivates subscription.
  - `POST /api/admin/push/send-to-order` (admin) — targets a specific customer by order ID.
  - `POST /api/admin/push/broadcast` (admin) — audience-targeted broadcast (all, by phone, by segment).
  - `GET /api/admin/push/send-log` (admin) — returns in-memory ring buffer of last 200 push send events.
- **Admin UI** ([SellerHub.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/SellerHub.tsx)): New Push Notifications tab with composer form (order vs. broadcast mode), send history telemetry feed, and audience filters.
- **Order Lifecycle Integration**: `sendOrderStatusPushNotification()` fires automatically inside `/api/update-order-status` to notify the customer on every status change.

### ✅ New: Admin Auth Rate Limiting & Failure Logging
- **Rate Limiter** ([server.ts:92-193](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts#L92-L193)): After 5 failed admin key attempts within 15 minutes, the IP is locked out for 15 minutes (`RATE_LIMIT_MAX_FAILURES=5`, `RATE_LIMIT_WINDOW_MS=15min`, `RATE_LIMIT_LOCKOUT_MS=15min`).
- **Failure Log**: Every failed attempt is recorded with `ip`, `path`, `reason` (`missing_key | invalid_key | rate_limited`), and timestamp.
- **Admin Endpoints**: `GET /api/admin/auth-fail-logs` and `POST /api/admin/auth-fail-logs/clear` expose the log to the admin panel.

### ✅ New: Admin Logout Button
- [SellerHub.tsx:2195-2200](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/SellerHub.tsx#L2195-L2200): A dedicated logout button (Lucide `LogOut` icon) calls the `onLogout` prop, clearing the admin session without a page reload.

### ✅ New: Chat Support Logs Tab in Seller Hub
- [SellerHub.tsx:2221](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/SellerHub.tsx#L2221) & [6396](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/SellerHub.tsx#L6396): A "Chat Support Logs" tab surfaces unmatched customer questions via `GET /api/admin/unmatched-questions` ([server.ts:3046](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts#L3046)). Admin can bulk-clear via `POST /api/admin/unmatched-questions/clear`.

### ✅ New: WhatsApp Fallback in SupportChat
- [SupportChat.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/SupportChat.tsx): A WhatsApp fallback button allows customers to escalate from the AI chatbot to direct WhatsApp contact.

### ✅ New: Data Folder Security Hardening
- [server.ts](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts): Middleware blocks all direct `GET` requests to the root `data/` folder (which contains `orders.json` and `products.json`), preventing public exposure of sensitive data.
- `.gitignore` updated to exclude `data/` dynamic databases from the repository.

### ✅ New: Product Context in SupportChat
- [ChatContext.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/contexts/ChatContext.tsx): `productContext` state propagates product metadata into the support chat session.
- [SupportChat.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/SupportChat.tsx): Renders a product context card, auto-closes the product details modal on chat open, and prefills the chat with the product's name.

---

## 🏛️ CONSTITUTIONAL & ARCHITECTURAL VIOLATIONS (GEMINI.md)

1. **Missing 3D Centerpiece (Violation of Rule #2)**:
   - **Constitutional Requirement**: *"Hero section layout must have a dedicated empty responsive container for the interactive Spline 3D model, ensuring it remains loaded across routing views."*
   - **Reality**: The component [Hero3DStage.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/Hero3DStage.tsx) is completely implemented and handles both Spline (`.splinecode`) and Three.js formats (`.glb`, `.stl`, `.obj`), but it is **never imported or rendered** anywhere in the main layout (such as [App.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/App.tsx) or [HeroSection.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/HeroSection.tsx)). The centerpiece remains missing.
2. **Instant Router Swapping (Violation of Rule #3)**:
   - **Constitutional Requirement**: *"Router swaps main layouts smoothly using opacity fades and translate transitions."*
   - **Reality**: While [App.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/App.tsx#L164-L171) triggers opacity fade class transitions, layouts are swapped instantly and lack the translate transitions (sliding/motion offsets) required by the constitution.

---

## 🚨 CRITICAL PRODUCTION BUGS & REGRESSIONS

> ✅ **No active P0 bugs.** The broken admin order update (previously P0) has been resolved.

---

## 🐛 CODEBASE QUALITY & DATA DEFECTS

| # | Bug | File | Evidence / Code Location |
|---|-----|------|--------------------------|
| 1 | **Scraped Stats & Designer Names Discarded** | [types.ts:21-51](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/types.ts#L21-L51) & [server.ts:242-286](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts#L242-L286) | The fields `likes`, `downloads`, and `designerName` are extracted by the Playwright scraper but are omitted from the `Product` database schema and TypeScript definition. When saved to the database, they are discarded. Consequently, [ProductGrid.tsx:373-379](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductGrid.tsx#L373-L379) fabricates these stats dynamically based on price/review counts. |
| 2 | **Playwright Browser Singleton Leak** | [makerworld_scraper.ts:13-34](file:///g:/Antigravity%20Projects/Belvia%20version%201/tools/makerworld_scraper.ts#L13-L34) | The browser singleton instance (`browserInstance`) is launched on-demand but has no lifecycle event listeners (e.g., `process.on('exit')`) to close it, which will leak headless Chromium processes upon backend restarts. |
| 3 | **Push Notifications: VAPID Key Dependency** | [usePushNotifications.ts:47](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/hooks/usePushNotifications.ts#L47) | `VITE_VAPID_PUBLIC_KEY` must be present in `.env` for push to function. If the env var is missing or empty, `isSupported` returns `false` silently with no user-visible fallback beyond the hook error state. |
| 4 | **In-Memory Push Send Log** | [server.ts:3462-3463](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts#L3462-L3463) | The `pushSendLog` ring buffer (max 200 entries) is stored purely in-memory. Server restarts wipe all push history — no persistent log to Supabase or disk. |

---

## 📋 LAUNCH READINESS CHECKLIST

| Item | Ready? | Status / Notes |
|------|--------|----------------|
| **Production build compiles** | ✅ | Works. TypeScript type check and Vite bundling succeed with zero errors. |
| **Customer checkout secure** | ✅ | Checkout uses singular `POST /api/save-order` with server validation. |
| **Admin order updates working** | ✅ | **FIXED:** SellerHub now calls `/api/update-order-status` correctly. |
| **Browser push notifications** | ✅ | Full-stack: service worker, VAPID hook, server endpoints, admin composer, order lifecycle integration. |
| **Admin auth rate limiting** | ✅ | 5-attempt lockout / 15-min window with IP-based failure log. |
| **Admin logout button** | ✅ | Implemented in SellerHub header. |
| **Chat support logs (admin)** | ✅ | Unmatched question logs tab visible in Seller Hub. |
| **WhatsApp chat fallback** | ✅ | Escalation button added to SupportChat. |
| **Data folder security** | ✅ | `data/` route blocked on server, excluded from git. |
| **Interactive 3D Model Centerpiece** | ❌ | **BLOCKED:** `Hero3DStage` remains unlinked and orphaned. |
| **Smooth Router Transitions** | ⚠️ | Uses opacity transitions, but lacks translate (sliding) transitions. |
| **Sitemap XML validity** | ✅ | Typos cleaned. |
| **Database Synchronization** | ✅ | Automatically upserts to Supabase or falls back safely to filesystem JSON. |
| **Push send log persistence** | ⚠️ | In-memory only — wiped on server restart. Not critical for launch. |

---

## 🛠️ ACTION PLAN FOR NEXT DEPLOYMENT

1. **Mount the Interactive 3D Model (HIGH)**:
   - Import and mount `Hero3DStage` in [App.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/App.tsx) inside a responsive layout container in the hero section.
2. **Add Translate to Router Transitions (MEDIUM)**:
   - Refactor tab-switching style classes in `App.tsx` to include displacement (e.g. `translateY(8px)` to `translateY(0)`) alongside the opacity transition.
3. **Persist Push Send Log to Supabase (LOW)**:
   - Add a `push_send_log` table and write each log entry on send, so history survives server restarts.
4. **Scraping Data Integrity (LOW)**:
   - Add `likes`, `downloads`, and `designerName` to the `Product` type in `types.ts`, and map them in `server.ts` during product saves.
5. **Playwright Browser Lifecycle Cleanup (LOW)**:
   - Add `process.on('exit', () => browserInstance?.close())` in [makerworld_scraper.ts](file:///g:/Antigravity%20Projects/Belvia%20version%201/tools/makerworld_scraper.ts) to prevent headless Chromium leaks.
6. **Roadmap: Migrate Shared Admin Key to Supabase Role-Based Access Control (SECURITY)**:
   - Transition the admin panel from a single static shared secret (`ADMIN_SECRET_KEY` in `localStorage`) to individual Supabase accounts with custom claims (role-based access) and Supabase RLS (Row Level Security) policies on products and orders. This eliminates the risk of static key leakage via XSS and enables device-level session revocation.
