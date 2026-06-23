-- ── Add carousel_order Column to Products Table ──────────────────────────
-- Copy and paste this script directly into the Supabase Dashboard SQL Editor and click 'Run'.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS carousel_order INTEGER DEFAULT 0;
