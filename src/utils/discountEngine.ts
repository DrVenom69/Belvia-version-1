/**
 * src/utils/discountEngine.ts
 *
 * Pure, deterministic discount resolver. No DB calls — all inputs are pre-fetched.
 * CRITICAL RULE: Only the single highest-priority applicable discount wins. No stacking.
 *
 * Priority order (highest to lowest):
 *   1. Coupon code (explicit user action)
 *   2. Festival discount (admin-controlled, site-wide or category-scoped)
 *   3. Loyalty tier (based on completed order count)
 *   4. New User (first order, 10% off)
 */

import type { AppliedCoupon, ActiveFestival, DiscountResult, DiscountType } from '../types';
import { LOYALTY_TIERS } from '../types';

export interface ResolveDiscountOptions {
  /** Cart subtotal in BDT (before any discount) */
  subtotal: number;
  /** Product categories in the cart — used for festival category scoping */
  cartCategories: string[];
  /** Pre-validated coupon from /api/validate-coupon (or null) */
  coupon?: AppliedCoupon | null;
  /** Active festival from /api/active-festival (or null) */
  festival?: ActiveFestival | null;
  /** Number of COMPLETED orders for this user (status === 'Completed') */
  completedOrderCount: number;
  /** True if the user has never placed any order (completedOrderCount === 0 AND no pending orders) */
  isFirstOrder: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getLoyaltyTier(completedOrders: number) {
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    const tier = LOYALTY_TIERS[i];
    if (completedOrders >= tier.minOrders) return tier;
  }
  return LOYALTY_TIERS[0]; // Bronze fallback
}

export function getNextLoyaltyTier(completedOrders: number) {
  const current = getLoyaltyTier(completedOrders);
  const idx = LOYALTY_TIERS.findIndex(t => t.name === current.name);
  return idx < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[idx + 1] : null;
}

/** Compute progress text towards next tier */
export function getLoyaltyProgress(completedOrders: number): string {
  const next = getNextLoyaltyTier(completedOrders);
  if (!next) return 'Maximum Platinum tier reached!';
  const needed = next.minOrders - completedOrders;
  return `${needed} more order${needed !== 1 ? 's' : ''} to reach ${next.name} (${next.percent}% off)`;
}

/** Compute the discount amount for a percentage applied to a specific subtotal */
function pctDiscount(subtotal: number, percent: number): number {
  return Math.round(subtotal * (percent / 100));
}

// ── Main resolver ───────────────────────────────────────────────────────────────

export function resolveDiscount(opts: ResolveDiscountOptions): DiscountResult {
  const { subtotal, cartCategories, coupon, festival, completedOrderCount, isFirstOrder } = opts;

  const none: DiscountResult = { type: null, percent: 0, discountAmount: 0, label: '' };

  // ── 1. Coupon code (highest priority) ──────────────────────────────────────
  if (coupon) {
    const discAmt = coupon.type === 'percent'
      ? pctDiscount(subtotal, coupon.value)
      : Math.min(Math.round(coupon.value), subtotal);
    const pct = coupon.type === 'percent' ? coupon.value : Math.round((coupon.value / subtotal) * 100);
    return {
      type: 'coupon',
      percent: pct,
      discountAmount: discAmt,
      label: coupon.type === 'percent'
        ? `Coupon ${coupon.code} — ${coupon.value}% off`
        : `Coupon ${coupon.code} — ৳${coupon.value} off`,
      couponCode: coupon.code,
    };
  }

  // ── 2. Festival discount ────────────────────────────────────────────────────
  if (festival && festival.percent > 0) {
    const isSiteWide = !festival.category;
    const appliesToCart = isSiteWide || cartCategories.some(c =>
      c.toLowerCase() === festival.category!.toLowerCase()
    );

    if (appliesToCart) {
      // If category-scoped, discount applies only to matching items' subtotal.
      // Since we only have the aggregate subtotal here, we calculate on full subtotal for site-wide
      // and let the CartDrawer pass a category-filtered subtotal when category is set.
      const discAmt = pctDiscount(subtotal, festival.percent);
      const scopeLabel = isSiteWide ? 'Site-wide' : festival.category;
      return {
        type: 'festival',
        percent: festival.percent,
        discountAmount: discAmt,
        label: `${festival.name} — ${festival.percent}% off (${scopeLabel})`,
      };
    }
  }

  // ── 3. Loyalty tier ─────────────────────────────────────────────────────────
  const tier = getLoyaltyTier(completedOrderCount);
  if (tier.percent > 0) {
    return {
      type: 'loyalty',
      percent: tier.percent,
      discountAmount: pctDiscount(subtotal, tier.percent),
      label: `Loyalty ${tier.name} — ${tier.percent}% off`,
    };
  }

  // ── 4. New User (first order) ────────────────────────────────────────────────
  if (isFirstOrder) {
    return {
      type: 'new_user',
      percent: 10,
      discountAmount: pctDiscount(subtotal, 10),
      label: 'First Order — 10% off',
    };
  }

  return none;
}
