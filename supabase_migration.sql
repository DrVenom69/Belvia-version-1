-- ── Supabase Database Migration Script ──────────────────────────────
-- Table structure for products and orders in Belvia 3D Precision Labs
-- Copy and paste this script directly into the Supabase Dashboard SQL Editor and click 'Run'.

-- ── 1. Create Products Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    "startingPrice" DOUBLE PRECISION DEFAULT 0.0,
    "weightGrams" INTEGER DEFAULT 0,
    "filamentUsage" DOUBLE PRECISION DEFAULT 0.0,
    "isPreOrder" BOOLEAN DEFAULT false,
    "stockQuantity" INTEGER DEFAULT -1,
    images JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    materials JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    "printTimeMinutes" INTEGER DEFAULT 0,
    rating DOUBLE PRECISION DEFAULT 5.0,
    "reviewCount" INTEGER DEFAULT 0,
    reviews JSONB DEFAULT '[]'::jsonb,
    "makerWorldUrl" TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    resin_enabled BOOLEAN DEFAULT false,
    resin_price INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public anon/authenticated) to read products
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);


-- ── 2. Create Orders Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    "totalCost" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "totalWeight" DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    "shippingInfo" JSONB DEFAULT '{}'::jsonb NOT NULL,
    payment JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "orderType" TEXT DEFAULT 'standard'::text,
    "depositPercentage" INTEGER,
    "trackingCode" TEXT DEFAULT ''::text,
    "_confirmationSent" BOOLEAN DEFAULT false,
    design_credit_enabled BOOLEAN DEFAULT false,
    design_credit_amount INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to orders (optional: only if matching phone/ID is desired client-side,
-- but since the Express server service_role client queries them, no public policies are strictly required).
CREATE POLICY "Allow read access to orders" ON public.orders
    FOR SELECT USING (true);

-- ── 3. Migration: Add stock_quantity column to existing products table ──
-- If you already ran the initial migration above, uncomment the line below
-- and run it once to add the stock tracking column to existing rows:
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT -1;
