-- ── Create Categories Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    parent_group TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/anon/authenticated) to read categories
CREATE POLICY "Allow public read access to categories" ON public.categories
    FOR SELECT USING (true);

-- Seed Categories with all 14 existing categories from types.ts
INSERT INTO public.categories (name, parent_group) VALUES
  ('Keychains', 'Accessories & Merch'),
  ('Home Decor', 'Art & Sculptures'),
  ('Desk Accessories', 'Desk & Organisation'),
  ('Gaming Accessories', 'Gaming & Spares'),
  ('Figures & Collectibles', 'Art & Sculptures'),
  ('Business Merchandise', 'Accessories & Merch'),
  ('Custom Orders', 'Custom & Other'),
  ('Functional Prints', 'Desk & Organisation'),
  ('3D Printers & Spares', 'Gaming & Spares'),
  ('Exotic Filaments', 'Custom & Other'),
  ('Premium Hardware', 'Custom & Other'),
  ('Imported Goods', 'Custom & Other'),
  ('A1 Mini Mods', 'Custom & Other'),
  ('Hotends', 'Custom & Other')
ON CONFLICT (name) DO NOTHING;
