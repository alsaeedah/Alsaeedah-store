
-- 1. CONSOLIDATION UNIT: public.profiles is the single source of truth
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

-- 2. DATA RESCUE: Migrate from 'users' table if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, created_at)
        SELECT 
            id, 
            email, 
            COALESCE(name, email), 
            phone, 
            governorate, 
            district, 
            neighborhood, 
            created_at
        FROM public.users
        ON CONFLICT (id) DO UPDATE SET
            full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
            whatsapp = COALESCE(public.profiles.whatsapp, EXCLUDED.whatsapp);
            
        -- Cleanup redundant table
        DROP TABLE public.users CASCADE;
        RAISE NOTICE 'Data migrated and users table removed.';
    END IF;
END $$;

-- 3. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. THE ULTIMATE TRIGGER FUNCTION
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

-- 5. TRIGGER SETUP
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE 'UNIFIED SCHEMA CONSOLIDATION COMPLETE'; END $$;
