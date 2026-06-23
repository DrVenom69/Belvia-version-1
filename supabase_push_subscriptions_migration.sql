-- ── Push Subscriptions Migration ─────────────────────────────────────
-- Table for storing browser Web Push subscription objects per customer.
-- Copy and paste this into the Supabase Dashboard SQL Editor and click 'Run'.
-- Run AFTER the main supabase_migration.sql.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Customer identity anchors — at least one must be set.
    -- user_id is from supabase auth (logged-in customers).
    -- phone is the primary key for order-notification matching (guest or logged-in).
    user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email         TEXT,
    phone         TEXT,

    -- The Web Push subscription object returned by pushManager.subscribe()
    endpoint      TEXT NOT NULL UNIQUE,    -- Push service URL (unique per browser install)
    p256dh        TEXT NOT NULL,           -- Browser's public key for payload encryption
    auth_key      TEXT NOT NULL,           -- Browser's auth secret for payload encryption

    -- Metadata
    user_agent    TEXT,                    -- Browser/OS string, useful for debugging
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at  TIMESTAMPTZ,            -- Updated on each successful send
    is_active     BOOLEAN NOT NULL DEFAULT true  -- Set to false on 410 Gone / 404 errors

);

-- Indexes for fast lookup by customer identity
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_phone   ON public.push_subscriptions(phone);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email   ON public.push_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active  ON public.push_subscriptions(is_active);

-- RLS: Enable security — only the service role (server) can read/write.
-- Customers should never be able to see each other's push endpoints.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- No public SELECT policy needed — all reads are via the server's service_role key.
-- If you want logged-in customers to unsubscribe via the client directly, add:
-- CREATE POLICY "Users can manage their own subscription"
--   ON public.push_subscriptions
--   FOR ALL USING (auth.uid() = user_id);
