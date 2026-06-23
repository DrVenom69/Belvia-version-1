# Spec: Thumbnail Gallery Scrollbar & Main Image Zoom Fix

## Overview
This specification details the fixes for the thumbnail gallery scrollbar rendering issue and the main image zoom-on-load cropping issue on the product detail modal.

## Technical Details

### 1. Scrollbar Utility Compilation Fix
We will define `.scrollbar-none` as a Tailwind CSS v4 `@utility` in `src/index.css` to prevent the compiler from purging the `-webkit-scrollbar` rules:
```css
@utility scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none !important;
  }
}
```

### 2. Main Product Image Aspect-Ratio Fix
We will update the main image viewer in `src/components/ProductDetailsModal.tsx` to use `object-contain` instead of `object-cover` to display the full image by default without cropping:
```tsx
<img
  referrerPolicy="no-referrer"
  src={currentImage}
  alt={product.title}
  className="w-full h-full object-contain transition-all duration-300"
  onError={(e) => {
    e.currentTarget.src = '/images/placeholder.png';
  }}
/>
```

## Verification Plan
1. Run `npm run lint` and `npm run build` to verify clean compilation.
2. Confirm the fix visually on first load across both desktop and mobile viewports.
