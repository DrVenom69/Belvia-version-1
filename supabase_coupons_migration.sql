-- ── Belvia Coupon System Migration ──────────────────────────────────────────
-- Run this in the Supabase Dashboard SQL Editor.

CREATE TABLE IF NOT EXISTS public.coupons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('percent', 'flat')),
  value       NUMERIC NOT NULL,
  max_uses    INTEGER DEFAULT NULL,      -- null = unlimited
  uses_count  INTEGER DEFAULT 0,
  valid_from  TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ DEFAULT NULL,  -- null = no expiry
  created_by  TEXT,                      -- influencer/creator name for ROI tracking
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast code lookup at checkout
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (UPPER(code));
