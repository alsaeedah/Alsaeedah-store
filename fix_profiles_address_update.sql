-- ============================================================
-- FIX: Add address columns to public.users table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add whatsapp, governorate, district, neighborhood columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Allow users to update their own record (including new address fields)
DROP POLICY IF EXISTS "users_self_update" ON public.users;
CREATE POLICY "users_self_update"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Confirm read access is open
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
CREATE POLICY "users_read_policy"
    ON public.users FOR SELECT
    USING (true);

SELECT 'Users address columns added successfully' AS result;
