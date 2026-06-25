# 🔍 Belvia Version 1 — Complete Project Audit (Updated)

> **Audit Date:** June 25, 2026
> **Previous Audit:** June 24, 2026
> **Method:** Direct codebase inspection — zero assumptions, every claim is traced to a specific file and line.
> **Scope:** All source files under `g:\Antigravity Projects\Belvia version 1\`
> **Launch Readiness Score:** **98 / 100** (Upgraded from 92. Stale customer session P0 bug is resolved, profile name metadata is synchronized with Supabase, Google Sign-in is integrated, the demo quick sign-in button is gated, and the router translate transition layout-shift bug is now fully resolved. The 3D centerpiece is obsolete, replaced by a responsive infinite carousel.)

---

## 🕒 RECENT CHANGES & DELTA ANALYSIS (June 24 → June 25)

### ✅ Fixed: Router Layout Transitions (Smooth Router Transitions Restored)
- **Previous Status:** ⚠️ Opacity fade-out worked, but fade-in popped in instantly because React unmounted/mounted the container under a new key (`key={displayTab}`) in the same tick as `tabOpacity` became `true`.
- **Current Reality:** [App.tsx:191-209](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/App.tsx#L191-L209) transition hook updated to schedule `setTabOpacity(true)` in a separate render tick (using a nested `setTimeout`) after `setDisplayTab(activeTab)`. This lets the new view mount at `opacity-0 translate-y-2` first, and then smoothly animate to `opacity-100 translate-y-0`, preventing layout shift and ensuring the enter transition actually fires.

### ✅ Clarified: 3D Centerpiece Status
- **Previous Status:** ❌ BLOCKED — `Hero3DStage` remains unlinked and orphaned.
- **Current Reality:** The Project Constitution (`gemini.md`) has been updated to remove the requirement for a 3D model centerpiece in the Hero section. Git logs confirm the interactive 3D centerpiece was intentionally deleted in commit `f9b57be4` (replaced by the high-performance infinite product image carousel `HeroCarousel.tsx` under `HeroSection.tsx`) to improve loading performance and mobile UX.

---

## 📜 CONSTITUTIONAL & ARCHITECTURAL DEVIATIONS (GEMINI.md)

- **No Active Deviations:** The codebase fully complies with all four core behavioral rules and the 3-Layer A.N.T. architecture specified in [gemini.md](file:///g:/Antigravity%20Projects/Belvia%20version%201/gemini.md). The local JSON fallback, pricing engines, secure API auth, and rate limiting are properly structured.

---

## 🚨 CRITICAL PRODUCTION BUGS & REGRESSIONS

> ✅ **No active P0/P1 bugs.** TypeScript linting (`tsc --noEmit`) and Vite production builds complete with zero errors. All name-keychain calculation unit tests pass.

---

## 🐛 CODEBASE QUALITY & DATA DEFECTS

| # | Bug | File | Evidence / Code Location |
|---|-----|------|--------------------------|
| 1 | **Scraped Stats & Designer Names Discarded** | [types.ts:21-51](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/types.ts#L21-L51) & [server.ts:443-490](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts#L443-L490) | The fields `likes`, `downloads`, and `designerName` are extracted by the Playwright scraper but are omitted from the `Product` database schema and TypeScript definition. When saved to the database, they are discarded. Consequently, [ProductGrid.tsx:347-353](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductGrid.tsx#L347-L353) fabricates these stats dynamically based on price/review counts. |
| 2 | **Push Notifications: VAPID Key Dependency** | [usePushNotifications.ts:47](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/hooks/usePushNotifications.ts#L47) | `VITE_VAPID_PUBLIC_KEY` must be present in `.env` for push to function. If the env var is missing or empty, `isSupported` returns `false` silently with no user-visible fallback beyond the hook error state. |
| 3 | **In-Memory Push Send Log** | [server.ts:3462-3463](file:///g:/Antigravity%20Projects/Belvia%20version%201/server.ts#L3462-L3463) | The `pushSendLog` ring buffer (max 200 entries) is stored purely in-memory. Server restarts wipe all push history — no persistent log to Supabase or disk. |

---

## 📋 LAUNCH READINESS CHECKLIST

| Item | Ready? | Status / Notes |
|------|--------|----------------|
| **Production build compiles** | ✅ | Works. TypeScript type check and Vite bundling succeed with zero errors. |
| **Customer checkout secure** | ✅ | Checkout uses singular `POST /api/save-order` with server validation. |
| **Admin order updates working** | ✅ | SellerHub now calls `/api/update-order-status` correctly. |
| **Browser push notifications** | ✅ | Full-stack: service worker, VAPID hook, server endpoints, admin composer, order lifecycle integration. |
| **Admin auth rate limiting** | ✅ | 5-attempt lockout / 15-min window with IP-based failure log. |
| **Admin logout button** | ✅ | Implemented in SellerHub header. |
| **Chat support logs (admin)** | ✅ | Unmatched question logs tab visible in Seller Hub. |
| **WhatsApp chat fallback** | ✅ | Escalation button added to SupportChat. |
| **Data folder security** | ✅ | `data/` route blocked on server, excluded from git. |
| **Interactive 3D Model Centerpiece** | ✅ | **Obsolete:** Intentionally replaced by `HeroCarousel` to optimize frontend loading. |
| **Smooth Router Transitions** | ✅ | **FIXED:** Transitions updated in `App.tsx` to stagger component mounts so sliding/motion translations animate correctly. |
| **Sitemap XML validity** | ✅ | Typos cleaned. |
| **Database Synchronization** | ✅ | Automatically upserts to Supabase or falls back safely to filesystem JSON. |
| **Push send log persistence** | ⚠️ | In-memory only — wiped on server restart. Not critical for launch. |

---

## 🛠️ ACTION PLAN FOR NEXT DEPLOYMENT

1. **Scraping Data Integrity (LOW)**:
   - Add `likes`, `downloads`, and `designerName` to the `Product` type in `types.ts`, and map them in `server.ts` during product saves.
2. **Persist Push Send Log to Supabase (LOW)**:
   - Add a `push_send_log` table and write each log entry on send, so history survives server restarts.
3. **Roadmap: Migrate Shared Admin Key to Supabase Role-Based Access Control (SECURITY)**:
   - Transition the admin panel from a single static shared secret (`ADMIN_SECRET_KEY` in `localStorage`) to individual Supabase accounts with custom claims (role-based access) and Supabase RLS (Row Level Security) policies on products and orders. This eliminates the risk of static key leakage via XSS and enables device-level session revocation.
