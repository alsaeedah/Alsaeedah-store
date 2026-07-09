-- Fix Products Table Permissions
-- Run this script in your Supabase SQL Editor

-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies to start fresh
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- 3. Create a policy for public VIEW access (required for the storefront)
-- This allows anyone (even not logged in) to see the products
CREATE POLICY "Public can view products" 
ON public.products 
FOR SELECT 
USING (true);

-- 4. Create a policy for full access by authenticated users (Dashboard users)
-- This allows logged-in users to perform all actions
CREATE POLICY "Authenticated users can manage products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Grant necessary permissions to roles
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;
GRANT SELECT ON TABLE public.products TO anon;

-- 6. Enable Real-time for products table
-- This allows Supabase to broadcast changes (INSERT, UPDATE, DELETE) to the client
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
END $$;
