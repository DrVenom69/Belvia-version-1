-- ── Migration: Add colorStock column for tracking per-color stock levels ──
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "colorStock" JSONB DEFAULT '{}'::jsonb;
