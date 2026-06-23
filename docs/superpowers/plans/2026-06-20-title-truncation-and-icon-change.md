# Store Grid Layout & Icon Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the store grid product cards to display titles wrapped to two lines with consistent height alignment, remove description text, preserve tag lines, and replace the download statistics icon with a printer icon.

**Architecture:** We will adjust CSS properties on the card elements inside the React components, swap imported Lucide Icons, and check layout heights using CSS class combinations.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons

---

### Task 1: Update ProductGrid Imports and Card Layout

**Files:**
- Modify: `src/components/ProductGrid.tsx:1-495`

- [ ] **Step 1: Swap Download icon import for Printer icon**

Open [ProductGrid.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductGrid.tsx) and change the import from `'lucide-react'` around lines 2:
```tsx
import { Search, SlidersHorizontal, Tag, Zap, Eye, RotateCw, Star, Heart, Layers, Printer, Check } from 'lucide-react';
```

- [ ] **Step 2: Update Title Element styling**

In [ProductGrid.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductGrid.tsx), locate the product title rendering around lines 424-429 and update the `className` of the `<h3>` tag to replace `line-clamp-1` with `line-clamp-2 h-12 leading-snug`:
```tsx
                          {/* Title */}
                          <h3 
                            onClick={() => onQuickView(p)}
                            className="font-display font-extrabold text-sm text-text-primary mt-1 line-clamp-2 h-12 leading-snug group-hover:text-accent transition cursor-pointer hover:underline"
                          >
                            {p.title}
                          </h3>
```

- [ ] **Step 3: Replace Download stats icon with Printer stats icon**

In [ProductGrid.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductGrid.tsx), locate the stats block around lines 437-442 and change the `<Download>` element to a `<Printer>` element:
```tsx
                            <span className="flex items-center space-x-1">
                              <Printer className="w-3.5 h-3.5 text-text-secondary" />
                              <span>{downloads.toLocaleString()}</span>
                            </span>
```

- [ ] **Step 4: Remove description block**

In [ProductGrid.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductGrid.tsx), locate the short description `<p>` tag around lines 451-455 and delete it entirely.

- [ ] **Step 4.5: Update tags section to use sr-only**

In [ProductGrid.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductGrid.tsx), update the tags rendering paragraph to use `className="sr-only"` for visual hiding while remaining accessible for SEO indexing:
```tsx
                          {/* Subtle tags — visually hidden for SEO optimization */}
                          {Array.isArray(p.tags) && p.tags.length > 0 && (
                            <p className="sr-only">
                              {p.tags.join(' · ')}
                            </p>
                          )}
```

- [ ] **Step 5: Run lint check**

Run: `npm run lint`
Expected: Success with no output

- [ ] **Step 6: Run production build**

Run: `npm run build`
Expected: Success with built output static assets

- [ ] **Step 7: Manual confirmation**

1. Run `npm run dev` to start the local server.
2. Open a browser window to `http://localhost:3000`.
3. Check the product grid on both desktop and mobile viewports.
4. Verify titles wrap to two lines without misalignment.
5. Verify descriptions are gone and the tags line is completely visually hidden.
6. Verify the statistics block displays the Printer icon instead of the Download icon.
