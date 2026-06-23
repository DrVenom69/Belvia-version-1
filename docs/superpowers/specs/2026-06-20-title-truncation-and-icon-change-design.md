# Spec: Store Grid Title Truncation & Icon Change

## Overview
This specification details the design for wrapping product card titles to two lines with a fixed height (Option A), removing the description text while keeping the tag line, and replacing the download stats icon with a printer (3D print) icon.

## Technical Details

### 1. Product Card Title Wrapping & Alignment
In `src/components/ProductGrid.tsx`, we will update the title element:
- Modify `line-clamp-1` to `line-clamp-2`
- Add `h-12` and `leading-snug` to ensure a consistent height of 48px, keeping card heights perfectly uniform across the grid without clipping.

```tsx
<h3 
  onClick={() => onQuickView(p)}
  className="font-display font-extrabold text-sm text-text-primary mt-1 line-clamp-2 h-12 leading-snug group-hover:text-accent transition cursor-pointer hover:underline"
>
  {p.title}
</h3>
```

### 2. Remove Description & Keep Tags Line
In `src/components/ProductGrid.tsx`, we will:
- Delete the description paragraph:
```tsx
<p className="text-text-secondary text-[11px] line-clamp-2 leading-relaxed">
  {p.description}
</p>
```
- Visually hide the tags section but keep it in the DOM for SEO optimization:
```tsx
{Array.isArray(p.tags) && p.tags.length > 0 && (
  <p className="sr-only">
    {p.tags.join(' · ')}
  </p>
)}
```

### 3. Replace Download Icon with Printer Icon
- In `src/components/ProductGrid.tsx`, import `Printer` instead of `Download` from `'lucide-react'`.
- Replace the download icon `<Download className="w-3.5 h-3.5 text-text-secondary" />` with `<Printer className="w-3.5 h-3.5 text-text-secondary" />` in the statistics block.

## Verification Plan
1. Run `npm run lint` and `npm run build` to verify clean compilation.
2. Confirm the card layout is uniform and aligned correctly on both mobile and desktop viewports.
