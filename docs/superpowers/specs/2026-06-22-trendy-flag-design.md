# 🧠 Spec: Trendy Product Flag Design

## Goal
Admin needs a way to mark specific products as "trendy" so they appear ahead of normal products in the storefront's default listing order, with a fast way to toggle this directly from the product management table in Seller Hub.

## Proposed Design

### 1. Data Schema changes
- **types.ts**: Add optional field `is_trendy?: boolean;` to the `Product` interface.
- **Supabase**: Table `products` has already been updated with column `is_trendy BOOLEAN DEFAULT false`.
- **products.json (Fallback & Local)**: Add `"is_trendy": false` mapping on seed/import/save:
  - Update `tools/import_products.py` to write `"is_trendy": False` by default.
  - Update `server.ts` save-products endpoint to serialize and deserialize `is_trendy`.
  - Update `server.ts` get-products endpoint to seed products with `is_trendy` property.

### 2. Storefront Sorting & Badge
- **ProductGrid.tsx**:
  - Update default sort logic in `filteredProducts`:
    ```typescript
    if (sortBy === 'default') {
      const aTrendy = a.is_trendy || false;
      const bTrendy = b.is_trendy || false;
      if (aTrendy !== bTrendy) {
        return aTrendy ? -1 : 1;
      }
    }
    ```
  - Place a small "Trending" badge on the product grid card.
  - The badge will be a small amber/gold badge styled like the layers verification badge (using a `Flame` or `Star` icon from `lucide-react`) placed in the top-left badges flex group next to the layers badge.

### 3. Seller Hub Toggle & Forms
- **Seller Hub Table**:
  - Add an inline quick-toggle button/icon in the "Title" column or "Action" column (using a Flame or Star icon) that updates `is_trendy` for the clicked product using one click.
  - Trigger `onUpdateProducts(updatedProducts)` immediately to persist the change.
- **Seller Hub Forms**:
  - Add an `Is Trendy` checkbox/toggle to the Edit Product form (`editingProduct`).
  - Add an `Is Trendy` checkbox/toggle to the Manual Add Product form (`activeSubTab === 'manual'`).
