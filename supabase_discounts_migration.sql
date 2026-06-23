-- ── Belvia Multi-Tier Discount System Migration ─────────────────────────────
-- Run this in the Supabase Dashboard SQL Editor.

-- 1. Festival Discounts table
CREATE TABLE IF NOT EXISTS public.festival_discounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,          -- e.g. "Eid Sale 2026"
  percent    NUMERIC NOT NULL,       -- e.g. 20 for 20%
  category   TEXT DEFAULT NULL,      -- NULL = site-wide; matches Product.category
  start_date TIMESTAMPTZ NOT NULL,
  end_date   TIMESTAMPTZ NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add discount tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_type    TEXT;     -- 'coupon'|'festival'|'loyalty'|'new_user'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_percent NUMERIC;  -- e.g. 20 for 20%
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id          TEXT;     -- Supabase user.id for loyalty + new-user tracking
