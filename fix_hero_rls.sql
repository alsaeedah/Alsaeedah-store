-- ============================================================
-- Fix: Hero table RLS policies & sort_order column
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Make sure sort_order column exists (safe if already exists)
ALTER TABLE public.hero ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 2. Drop ALL existing policies on hero table to start clean
DROP POLICY IF EXISTS "Allow public read access" ON public.hero;
DROP POLICY IF EXISTS "Allow public all access"  ON public.hero;
DROP POLICY IF EXISTS "hero_select_policy"        ON public.hero;
DROP POLICY IF EXISTS "hero_insert_policy"        ON public.hero;
DROP POLICY IF EXISTS "hero_update_policy"        ON public.hero;
DROP POLICY IF EXISTS "hero_delete_policy"        ON public.hero;
DROP POLICY IF EXISTS "anon_full_access"          ON public.hero;

-- 3. Make sure RLS is enabled
ALTER TABLE public.hero ENABLE ROW LEVEL SECURITY;

-- 4. Grant full privileges to both anon and authenticated roles at DB level
GRANT ALL ON public.hero TO anon;
GRANT ALL ON public.hero TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Create a single permissive policy that allows ALL operations from anon & authenticated
CREATE POLICY "allow_all_hero_access"
ON public.hero
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Initialize sort_order for existing rows that have sort_order = 0
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
    FROM public.hero
    WHERE sort_order = 0 OR sort_order IS NULL
)
UPDATE public.hero
SET sort_order = numbered.rn
FROM numbered
WHERE public.hero.id = numbered.id;

-- 7. Verify: show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'hero';
