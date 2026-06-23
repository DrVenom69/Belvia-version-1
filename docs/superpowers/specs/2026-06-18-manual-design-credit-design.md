# Spec: Manual Per-Order Design Credit Surcharge

## Status
Approved (with user correction: Catalog price decreases by 12% royalty by omitting designerRoyalty without increasing belviaMarkup).

---

## 1. Goal
Make the "Design Credit" charge a manual per-order surcharge applied case-by-case by the administrator inside the Seller Hub order management panel, rather than an automatic global 12% royalty included in every catalog product's price.

---

## 2. Proposed Changes

### A. Schema Updates
* **`src/types.ts`**: Add the following fields to the `Order` interface:
  ```typescript
  design_credit_enabled?: boolean;
  design_credit_amount?: number | null; // charge in BDT
  ```
* **`supabase_migration.sql`**: Update order table schema definition to include:
  ```sql
  design_credit_enabled BOOLEAN DEFAULT false,
  design_credit_amount INTEGER DEFAULT NULL,
  ```
* **`supabase_design_credit_migration.sql` [NEW]**: Create migration file containing:
  ```sql
  -- Migration: Add design credit tracking columns to orders table
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS design_credit_enabled BOOLEAN DEFAULT false;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS design_credit_amount INTEGER DEFAULT NULL;
  ```

### B. Pricing Logic Updates
* **`src/components/ProductDetailsModal.tsx`**:
  * Remove `designerRoyalty` (12%) from calculations.
  * Do **NOT** increase `belviaMarkup` (stays at 48%).
  * Decrease the active base price by 12% (`product.price - Math.round(product.price * 0.12)`) and calculate cart/modal totals using this new, lower price.
  * Remove the "Designer Credit" line item from the "Manufacturing Quote" breakdown. The breakdown now lists Filament (18%), Assembly (22%), and Markup (48%), summing to the new lower 88% total price.

### C. Backend Recalculation & Save Logic
* **`server.ts`**:
  * Update `/api/save-order` to map `design_credit_enabled` (default `false`) and `design_credit_amount` (default `null`).
  * Update `/api/update-order-status` to accept `design_credit_enabled` and `design_credit_amount`.
  * Dynamically recalculate `totalCost` upon update as:
    $$\text{totalCost} = \max(0, \text{originalCost} - \text{discountAmount} + (\text{if design\_credit\_enabled} ? \text{design\_credit\_amount} : 0))$$
  * Save the recalculated `totalCost` and return the updated order object to the client.

### D. Seller Hub UI Updates
* **`src/components/SellerHub.tsx`**:
  * In the orders list table, display a "Design Credit: +৳[Amount]" badge in the **Total Price / Mass** column if enabled.
  * In the **Actions** column for each order, add:
    * A checkbox/toggle labeled "Design Credit".
    * A number input for the BDT amount (visible when checked).
    * A "Save Credit" button to send the updated design credit fields and current status to the `/api/update-order-status` endpoint.

### E. Customer Account UI Updates
* **`src/components/MyAccountHub.tsx`**:
  * Map `design_credit_enabled` and `design_credit_amount` fields into the `PastOrder` interface and mapping function.
  * Under the order price value, display a "Design Credit: +৳[Amount]" indicator if enabled.

---

## 3. Verification & Compliance
* Validate code by running `npm run lint` and `npm run build`.
* Walkthrough manual verification to confirm toggling design credit on/off updates order totals correctly.
