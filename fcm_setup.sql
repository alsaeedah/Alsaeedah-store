-- ============================================================
-- FCM MIGRATION: Create manager_push_tokens table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.manager_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id TEXT NOT NULL,           -- manager.id UUID or 'admin-user' for super admin
    fcm_token TEXT NOT NULL UNIQUE,     -- Firebase Cloud Messaging device token
    device_name TEXT,                   -- Browser User-Agent or device name
    platform TEXT DEFAULT 'web',        -- 'web' | 'android' | 'ios'
    app_version TEXT,                   -- App/dashboard version string
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_manager_push_tokens_manager_id
    ON public.manager_push_tokens(manager_id);

CREATE INDEX IF NOT EXISTS idx_manager_push_tokens_active
    ON public.manager_push_tokens(active)
    WHERE active = TRUE;

-- 3. Enable RLS
ALTER TABLE public.manager_push_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Allow dashboard (anon key) to insert tokens
DROP POLICY IF EXISTS "Allow insert for dashboard" ON public.manager_push_tokens;
CREATE POLICY "Allow insert for dashboard"
    ON public.manager_push_tokens
    FOR INSERT
    WITH CHECK (true);

-- 5. Allow dashboard (anon key) to update tokens (upsert)
DROP POLICY IF EXISTS "Allow update for dashboard" ON public.manager_push_tokens;
CREATE POLICY "Allow update for dashboard"
    ON public.manager_push_tokens
    FOR UPDATE
    USING (true);

-- 6. Allow select for dashboard and Edge Function token refresh checks
DROP POLICY IF EXISTS "Allow select for dashboard" ON public.manager_push_tokens;
CREATE POLICY "Allow select for dashboard"
    ON public.manager_push_tokens
    FOR SELECT
    USING (true);

-- 7. Allow delete (for invalid token cleanup from Edge Function via service role)
DROP POLICY IF EXISTS "Allow delete for service role" ON public.manager_push_tokens;
CREATE POLICY "Allow delete for service role"
    ON public.manager_push_tokens
    FOR DELETE
    USING (true);

-- 8. Drop the old push_subscriptions table (legacy VAPID)
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

-- ============================================================
-- Done. Verify with:
-- SELECT * FROM public.manager_push_tokens LIMIT 10;
-- ============================================================
