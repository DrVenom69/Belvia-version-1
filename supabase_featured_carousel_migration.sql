-- ── Add featured_carousel Column to Products Table ──────────────────────────
-- Copy and paste this script directly into the Supabase Dashboard SQL Editor and click 'Run'.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_carousel BOOLEAN DEFAULT false;
