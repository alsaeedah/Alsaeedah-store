
-- 1. Add missing columns to 'profiles' table safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='whatsapp') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='governorate') THEN
        ALTER TABLE public.profiles ADD COLUMN governorate TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='district') THEN
        ALTER TABLE public.profiles ADD COLUMN district TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='neighborhood') THEN
        ALTER TABLE public.profiles ADD COLUMN neighborhood TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='image') THEN
        ALTER TABLE public.profiles ADD COLUMN image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Create or replace the sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, image, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'governorate',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'neighborhood',
    COALESCE(new.raw_user_meta_data->>'image', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    whatsapp = EXCLUDED.whatsapp,
    governorate = EXCLUDED.governorate,
    district = EXCLUDED.district,
    neighborhood = EXCLUDED.neighborhood,
    image = EXCLUDED.image,
    created_at = EXCLUDED.created_at;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync existing users (One-time migration)
INSERT INTO public.profiles (id, email, full_name, whatsapp, governorate, district, neighborhood, image, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'), 
    raw_user_meta_data->>'whatsapp', 
    raw_user_meta_data->>'governorate', 
    raw_user_meta_data->>'district', 
    raw_user_meta_data->>'neighborhood', 
    COALESCE(raw_user_meta_data->>'image', raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    whatsapp = EXCLUDED.whatsapp,
    governorate = EXCLUDED.governorate,
    district = EXCLUDED.district,
    neighborhood = EXCLUDED.neighborhood,
    image = EXCLUDED.image,
    created_at = EXCLUDED.created_at;

-- 5. Create a function to delete a user from auth.users (Admin Function)
DROP FUNCTION IF EXISTS public.delete_user_by_admin(uuid);
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void AS $$
BEGIN
    -- Delete from profiles (optional if cascade is set, but safe to do manually)
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- Delete active sessions to force logout
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission so the dashboard can call it
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO anon, authenticated;

-- 7. Enable Realtime for profiles table (Critical for Force Logout)
-- Note: This might fail if 'supabase_realtime' publication doesn't exist, but it's standard in Supabase.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
