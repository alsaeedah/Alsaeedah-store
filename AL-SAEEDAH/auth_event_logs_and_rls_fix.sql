-- ============================================================
-- AL-SAEEDAH STORE — AUTH ENHANCEMENTS
-- Run this in the Supabase SQL Editor after the main schema.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. FIX: Add missing INSERT policy on profiles table
--    The trigger (SECURITY DEFINER) handles automatic inserts,
--    but users need an INSERT policy if they manually upsert.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────
-- 2. CREATE: auth_event_logs table for monitoring all auth events
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_event_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type  TEXT        NOT NULL,   -- e.g. 'login_email', 'login_google', 'signup_email', 'logout', etc.
    provider    TEXT,                   -- 'email' | 'google' | null
    metadata    JSONB       DEFAULT '{}',  -- error messages, browser info, etc.
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries per user
CREATE INDEX IF NOT EXISTS idx_auth_event_logs_user_id
  ON public.auth_event_logs(user_id);

-- Index for time-based queries (monitoring dashboards)
CREATE INDEX IF NOT EXISTS idx_auth_event_logs_created_at
  ON public.auth_event_logs(created_at DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_auth_event_logs_event_type
  ON public.auth_event_logs(event_type);


-- ─────────────────────────────────────────────────────────────
-- 3. RLS for auth_event_logs
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.auth_event_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view ONLY their own logs
DROP POLICY IF EXISTS "Users can view own auth logs" ON public.auth_event_logs;
CREATE POLICY "Users can view own auth logs"
  ON public.auth_event_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own logs
DROP POLICY IF EXISTS "Authenticated users can insert own logs" ON public.auth_event_logs;
CREATE POLICY "Authenticated users can insert own logs"
  ON public.auth_event_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can insert error logs (user_id will be null for pre-login errors)
DROP POLICY IF EXISTS "Anon can insert error logs" ON public.auth_event_logs;
CREATE POLICY "Anon can insert error logs"
  ON public.auth_event_logs
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);


-- ─────────────────────────────────────────────────────────────
-- 4. Optional: Realtime for auth_event_logs (admin monitoring)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.auth_event_logs REPLICA IDENTITY FULL;
