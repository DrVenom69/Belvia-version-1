# Spec: Chat Product-Context Prefill Bug & Mobile Layout Fix

## Overview
When a user clicks "Chat about this product" on a product detail modal, the support chat should open pre-filled with context about that product, including a beautiful visual card preview with a thumbnail, and the product details modal should close automatically. Additionally, the chat trigger button and window should not get cut off by bottom navbars or modal action bars on mobile/tablet devices.

## Proposed Changes

### 1. Chat Context (`src/contexts/ChatContext.tsx`)
- Add `productContext` state to allow holding reference to a selected `Product`.
- Update `triggerChat` to accept an optional `Product` object.
- Expose `productContext` and `setProductContext` to consumers of `useChat`.

### 2. Product Details Modal (`src/components/ProductDetailsModal.tsx`)
- Update the onClick handler for the "Chat about this product" button to pass the current `product` to `triggerChat`.
- Call `onClose()` inside the button's action handler to close the product details view.

### 3. Support Chat (`src/components/SupportChat.tsx`)
- Retrieve `productContext` and `setProductContext` from `useChat`.
- Elevate `z-index` of the chat wrapper element to `60` and use `bottom-20` on mobile to ensure it floats on top of the bottom navigation bar and sticky buy actions, falling back to `sm:bottom-6` on desktop.
- Render a premium cyber-industrial styled product card preview containing:
  - Product thumbnail image.
  - Category (accent color).
  - Product title.
  - Dismiss button `[x]` to clear context.
- Render this card right above the text input field when `productContext` is not null.
- Clear `productContext` after sending a message.

## Verification Plan
1. Open the website on desktop and click "Chat about this product" for at least two different products. Check that:
   - The product details modal closes automatically.
   - The support chat drawer opens.
   - A product preview card appears in the chat input area showing the product's thumbnail and title.
   - Sending the pre-filled message clears the product preview card from the input.
2. Verify the mobile layout using mobile responsiveness viewport testing. Check that the chat toggle trigger is positioned above the bottom navbar and doesn't get obscured.
3. Run `npm run lint` and `npm run build` to verify code validity.
