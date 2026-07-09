-- ============================================================
-- AL-SAEEDAH STORE CONSOLIDATED DATABASE SCHEMA SETUP
-- Run this script in the SQL Editor of your new Supabase project.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (Syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    whatsapp TEXT,
    governorate TEXT,
    district TEXT,
    neighborhood TEXT,
    image TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ensure profiles columns exist if the table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Sync function for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, image, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'neighborhood',
    COALESCE(new.raw_user_meta_data->>'image', new.raw_user_meta_data->>'avatar_url'),
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, 'User'), public.profiles.full_name, EXCLUDED.full_name),
    whatsapp = COALESCE(EXCLUDED.whatsapp, public.profiles.whatsapp),
    governorate = COALESCE(EXCLUDED.governorate, public.profiles.governorate),
    district = COALESCE(EXCLUDED.district, public.profiles.district),
    neighborhood = COALESCE(EXCLUDED.neighborhood, public.profiles.neighborhood);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for syncing new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Delete user admin RPC function
DROP FUNCTION IF EXISTS public.delete_user_by_admin(uuid);
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void AS $$
BEGIN
    DELETE FROM public.profiles WHERE id = target_user_id;
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO anon;

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    old_price NUMERIC DEFAULT NULL,
    category TEXT,
    style TEXT,
    image TEXT,
    "imageUrl" TEXT,
    images TEXT[],
    colors TEXT[],
    materials TEXT[],
    variants JSONB,
    video TEXT,
    "displayId" TEXT,
    featured BOOLEAN DEFAULT false,
    stock INTEGER DEFAULT 0,
    is_best_seller BOOLEAN DEFAULT false,
    is_latest BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.products;
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure products columns exist if the table was already created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS old_price NUMERIC DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS materials TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "displayId" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Product Indexes
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON public.products(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS idx_products_is_latest ON public.products(is_latest) WHERE is_latest = true;

-- Product Random Sort RPC Function
DROP FUNCTION IF EXISTS get_random_products(text,int,int,text,text,numeric,numeric,text);
CREATE OR REPLACE FUNCTION get_random_products(
  p_seed TEXT,
  p_offset INT,
  p_limit INT,
  p_category TEXT DEFAULT 'all',
  p_style TEXT DEFAULT 'all',
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search TEXT DEFAULT NULL
) RETURNS SETOF products 
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE
    (p_category = 'all' OR category = p_category) AND
    (p_style = 'all' OR style = p_style) AND
    (p_min_price IS NULL OR price >= p_min_price) AND
    (p_max_price IS NULL OR price <= p_max_price) AND
    (p_search IS NULL OR (name ILIKE '%' || p_search || '%' OR "displayId" ILIKE '%' || p_search || '%'))
  ORDER BY MD5(id::TEXT || p_seed)
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_random_products(TEXT, INT, INT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO public;
GRANT EXECUTE ON FUNCTION get_random_products(TEXT, INT, INT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_random_products(TEXT, INT, INT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated;

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address JSONB,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies
DROP POLICY IF EXISTS "Allow insert for all" ON public.orders;
DROP POLICY IF EXISTS "Allow full access for development" ON public.orders;
CREATE POLICY "Allow insert for all" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow full access for development" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Ensure orders columns and constraints exist if the table was already created
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Replica Identity for Realtime orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- 4. Create Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_favorite ON public.favorites (user_id, product_id);

-- Enable RLS for Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Favorites Policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- 6. Create Hero Table
CREATE TABLE IF NOT EXISTS public.hero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Hero
ALTER TABLE public.hero ENABLE ROW LEVEL SECURITY;

-- Hero Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.hero;
DROP POLICY IF EXISTS "Allow public all access" ON public.hero;
CREATE POLICY "Allow public read access" ON public.hero FOR SELECT USING (true);
CREATE POLICY "Allow public all access" ON public.hero FOR ALL USING (true) WITH CHECK (true);

-- Replica Identity for Realtime hero
ALTER TABLE public.hero REPLICA IDENTITY FULL;

-- 7. Configure Realtime Publications
-- Create publication if not exists or add tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.profiles, public.orders, public.hero;
