-- ── Add color_picker_count Column to Products Table ──────────────────────────
-- Controls how many independent color pickers are shown on the product detail page.
-- 0 = no picker (fixed design), 1 = single color picker (default), 2–4 = zone pickers.
-- Copy and paste this script directly into the Supabase Dashboard SQL Editor and click 'Run'.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_picker_count INTEGER DEFAULT 1;

-- Ensure valid range
ALTER TABLE public.products ADD CONSTRAINT color_picker_count_range CHECK (color_picker_count >= 0 AND color_picker_count <= 4);
