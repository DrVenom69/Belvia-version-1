# Thumbnail Scrollbar and Image Zoom Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the native horizontal scrollbar on the product details thumbnail strip and correct the main product image zoom crop on first load.

**Architecture:** We will define a custom Tailwind CSS v4 utility `@utility scrollbar-none` to prevent vendor-prefixed scrollbar rules from being stripped during compilation. We will also update the main image's object-fit class from `object-cover` to `object-contain` to show the full image on load.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite 6

---

### Task 1: Hide the Native Scrollbar in index.css

**Files:**
- Modify: `src/index.css:191-198`

- [ ] **Step 1: Replace the legacy scrollbar-none class with the Tailwind v4 @utility directive**

Open [index.css](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/index.css) and replace the CSS lines 191-198:
```css
/* Hide scrollbar utility */
@utility scrollbar-none {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none !important; /* Chrome, Safari and Opera */
  }
}
```

- [ ] **Step 2: Verify lint and build**

Run: `npm run lint`
Expected: Success with no output

Run: `npm run build`
Expected: Success with build output CSS and JS chunks

---

### Task 2: Correct the Main Product Image Zoom Crop

**Files:**
- Modify: `src/components/ProductDetailsModal.tsx:227-236`

- [ ] **Step 1: Change object-fit from object-cover to object-contain**

Open [ProductDetailsModal.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/ProductDetailsModal.tsx) and modify the main image rendering:
```tsx
                  {currentImage ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={currentImage}
                      alt={product.title}
                      className="w-full h-full object-contain transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                  ) : (
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: Success with no output

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Success with compiled assets

- [ ] **Step 4: Manual confirmation**

1. Ensure the local dev server is running (`npm run dev`).
2. Open a browser window to `http://localhost:3000`.
3. Open any product with multiple images (e.g. Modular Helix Desk Organizer).
4. Verify the main product image is not zoomed/cropped on load.
5. Verify the thumbnail gallery scrollbar is completely hidden on both desktop and mobile viewports.
