-- Smart Pricing and Inventory System Database Migration
-- (1) grams_remaining default is handled in server logic, not SQL.
-- (2) updated_at tracks updates to filament spools.
-- (3) material_recipe is a JSONB column on products table.
--
-- Example recipe structure (material_recipe column JSONB):
-- {
--   "filament_name": "PLA Black",
--   "filament_grams": 45,
--   "resin_grams": 2,
--   "accessories": ["Keychain Ring", "Packaging Box Small"],
--   "print_hours": 3.5,
--   "has_uv_finish": true,
--   "target_margin": 45
-- }

CREATE TABLE IF NOT EXISTS filaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,          -- PLA / PETG / TPU / Resin
  color TEXT,
  brand TEXT,
  spool_weight_grams INTEGER DEFAULT 1000,
  purchase_price_bdt NUMERIC NOT NULL,
  grams_remaining NUMERIC,     -- Managed by server, defaults to spool_weight_grams on creation
  is_empty BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,          -- piece / ml / gram
  cost_per_unit_bdt NUMERIC NOT NULL,
  stock_count INTEGER DEFAULT 0
);

-- Extend products table to support costing recipe
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_recipe JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS needs_price_review BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS floor_price_bdt NUMERIC;

-- Pre-seed accessories
INSERT INTO accessories (name, unit, cost_per_unit_bdt, stock_count)
VALUES 
  ('Keychain Ring', 'piece', 10, 100),
  ('UV Resin', 'gram', 10, 200),
  ('Packaging Box Small', 'piece', 30, 50),
  ('Packaging Box Large', 'piece', 50, 20)
ON CONFLICT (name) DO UPDATE 
SET cost_per_unit_bdt = EXCLUDED.cost_per_unit_bdt,
    unit = EXCLUDED.unit;
