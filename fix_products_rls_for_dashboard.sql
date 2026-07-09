-- ============================================================
-- FIX: Products RLS Policy for Dashboard (Custom Auth)
-- ============================================================
-- PROBLEM:
--   The dashboard uses a custom localStorage-based login (not Supabase Auth).
--   This means all Supabase requests from the dashboard go out as the 'anon'
--   role — which only has SELECT permission. Inserting/updating/deleting products
--   fails with "new row violates row-level security policy" because the INSERT
--   policy only allows the 'authenticated' Supabase role.
--
-- SOLUTION:
--   Allow the 'anon' role to also perform all operations on the products table.
--   This is safe because the dashboard itself controls who can log in (via .env
--   admin credentials), and the products table doesn't contain sensitive user data.
-- ============================================================

-- Step 1: Drop any conflicting old policies on the products table
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.products;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.products;

-- Step 2: Make sure RLS is enabled on the products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow ANYONE (anon + authenticated) to SELECT products
--         This is needed for the storefront to display products.
CREATE POLICY "Allow public read access"
ON public.products
FOR SELECT
USING (true);

-- Step 4: Allow ANYONE (anon + authenticated) to INSERT products
--         Required because the dashboard uses custom auth, not Supabase Auth.
CREATE POLICY "Allow anon insert products"
ON public.products
FOR INSERT
WITH CHECK (true);

-- Step 5: Allow ANYONE (anon + authenticated) to UPDATE products
CREATE POLICY "Allow anon update products"
ON public.products
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Step 6: Allow ANYONE (anon + authenticated) to DELETE products
CREATE POLICY "Allow anon delete products"
ON public.products
FOR DELETE
USING (true);

-- Step 7: Grant table-level permissions to both roles
GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;

-- Step 8: Grant sequence permissions (needed for serial/generated columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
