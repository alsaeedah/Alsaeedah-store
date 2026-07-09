
-- Force Fix: Disable RLS and Grant Public Access for Products
-- Run this in your Supabase SQL Editor

-- 1. Disable RLS to check if it's the cause of the hang
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to all common roles
GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.products TO postgres;

-- 3. Ensure the table is in the public schema and exposed to PostgREST
-- (Supabase does this by default if it's in 'public' schema)

-- 4. Verify there are products in the table (for your info)
SELECT count(*) FROM public.products;
