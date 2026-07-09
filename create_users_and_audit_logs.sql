-- ============================================================
-- AL-SAEEDAH STORE CENTRALIZED USER MANAGEMENT MIGRATION
-- Run this script in the SQL Editor of your Supabase project.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Rename profiles table to users safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.profiles RENAME TO users;
  END IF;
END $$;

-- 2. If users table doesn't exist (e.g. fresh database), create it
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  profile_image_url TEXT,
  store_owner_info TEXT,
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. Safely migrate/rename existing profiles columns to the new schema
DO $$
BEGIN
  -- Rename full_name to name
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') THEN
    ALTER TABLE public.users RENAME COLUMN full_name TO name;
  END IF;

  -- Rename whatsapp to phone
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'whatsapp') THEN
    ALTER TABLE public.users RENAME COLUMN whatsapp TO phone;
  END IF;

  -- Rename image to profile_image_url
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'image') THEN
    ALTER TABLE public.users RENAME COLUMN image TO profile_image_url;
  END IF;
END $$;

-- 4. Add new columns if they do not exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS store_owner_info TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_by_admin_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Clean up any NULL/empty values in phone and make it NOT NULL and UNIQUE
UPDATE public.users SET phone = id::text WHERE phone IS NULL OR phone = '';
ALTER TABLE public.users ALTER COLUMN phone SET NOT NULL;

-- 5b. Safely resolve any duplicate phone numbers by adding a suffix to older duplicates
WITH ranked_users AS (
  SELECT id, phone,
         ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
  FROM public.users
  WHERE phone IS NOT NULL AND phone <> ''
)
UPDATE public.users u
SET phone = u.phone || '_dup_' || substring(u.id::text from 1 for 4)
FROM ranked_users r
WHERE u.id = r.id AND r.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_phone_key' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
  END IF;
END $$;

-- 6. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Trigger function to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_phone TEXT;
BEGIN
  -- Try to extract phone number from virtual email format: phone_[phone]@alsaeedah.store
  IF NEW.email LIKE 'phone_%@alsaeedah.store' THEN
    extracted_phone := SUBSTRING(NEW.email FROM 'phone_(.*)@alsaeedah.store');
  ELSE
    extracted_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'whatsapp');
  END IF;

  INSERT INTO public.users (
    id,
    name,
    phone,
    password_hash,
    profile_image_url,
    store_owner_info,
    created_by_admin_id,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(extracted_phone, NEW.id::text),
    NEW.encrypted_password,
    COALESCE(NEW.raw_user_meta_data->>'profile_image_url', NEW.raw_user_meta_data->>'image', NEW.raw_user_meta_data->>'avatar_url'),
    NEW.raw_user_meta_data->>'store_owner_info',
    (NEW.raw_user_meta_data->>'created_by_admin_id')::uuid,
    COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    password_hash = EXCLUDED.password_hash,
    profile_image_url = EXCLUDED.profile_image_url,
    store_owner_info = EXCLUDED.store_owner_info,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Re-create the sync trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Sync existing auth users (One-time migration to ensure clean state)
WITH extracted_auth_users AS (
  SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
    COALESCE(
      CASE WHEN email LIKE 'phone_%@alsaeedah.store' THEN SUBSTRING(email FROM 'phone_(.*)@alsaeedah.store') ELSE NULL END,
      raw_user_meta_data->>'phone',
      raw_user_meta_data->>'whatsapp',
      id::text
    ) as phone,
    encrypted_password as password_hash,
    COALESCE(raw_user_meta_data->>'profile_image_url', raw_user_meta_data->>'image', raw_user_meta_data->>'avatar_url') as profile_image_url,
    raw_user_meta_data->>'store_owner_info' as store_owner_info,
    COALESCE((raw_user_meta_data->>'is_active')::boolean, true) as is_active,
    created_at
  FROM auth.users
),
ranked_auth_users AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
  FROM extracted_auth_users
)
INSERT INTO public.users (id, name, phone, password_hash, profile_image_url, store_owner_info, is_active, created_at)
SELECT 
    id, 
    name, 
    CASE WHEN rn > 1 THEN phone || '_dup_' || substring(id::text from 1 for 4) ELSE phone END, 
    password_hash,
    profile_image_url,
    store_owner_info,
    is_active,
    created_at
FROM ranked_auth_users
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    password_hash = EXCLUDED.password_hash;

-- 10. RPC function to create a new user from Admin panel (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
  p_name TEXT,
  p_phone TEXT,
  p_password TEXT,
  p_store_owner_info TEXT
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  v_email TEXT;
  v_encrypted_password TEXT;
  v_col RECORD;
  v_sql TEXT;
BEGIN
  -- Perform check on uniqueness of phone
  IF EXISTS (SELECT 1 FROM public.users WHERE phone = p_phone) THEN
    RAISE EXCEPTION 'رقم الهاتف هذا مسجل بالفعل لمستخدم آخر.';
  END IF;

  v_email := 'phone_' || p_phone || '@alsaeedah.store';
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  new_user_id := gen_random_uuid();

  -- Insert into auth.users (Supabase authentication system)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    v_encrypted_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', p_name,
      'phone', p_phone,
      'store_owner_info', p_store_owner_info,
      'is_active', true
    ),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Dynamically update any nullable text columns in auth.users for this new user to ''
  -- to prevent GoTrue "Database error querying schema" scan errors.
  FOR v_col IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND column_name IN (
        'confirmation_token', 
        'recovery_token', 
        'email_change_token_new', 
        'email_change_token_current', 
        'email_change', 
        'phone_change', 
        'phone_change_token', 
        'reauthentication_token'
      )
  LOOP
    v_sql := format('UPDATE auth.users SET %I = '''' WHERE id = %L', v_col.column_name, new_user_id);
    EXECUTE v_sql;
  END LOOP;

  -- Insert into audit_logs
  INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
  VALUES ('admin-user', 'ADD_USER', new_user_id, jsonb_build_object('name', p_name, 'phone', p_phone));

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_user_by_admin(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 11. RPC function to delete a user from Admin panel (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.users WHERE id = target_user_id;
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;

    -- Log the delete action
    INSERT INTO public.audit_logs (admin_id, action, target_user_id, details)
    VALUES ('admin-user', 'DELETE_USER', target_user_id, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO anon, authenticated;

-- 12. Update RLS policies on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_self_access" ON public.users;
DROP POLICY IF EXISTS "admin_all_access" ON public.users;
DROP POLICY IF EXISTS "allow_initial_insert" ON public.users;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Everyone can read active user names/photos for orders/reviews
CREATE POLICY "users_read_policy" ON public.users FOR SELECT USING (true);

-- Users can update their own name, profile image, password
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 13. Enable Realtime on users & audit_logs
DO $$
BEGIN
  -- If publication exists, safely drop public.profiles and add public.users
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    
    -- Drop profiles if it was part of the publication
    IF EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND c.relname = 'profiles' AND n.nspname = 'public'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
    END IF;

    -- Add users if it is not already part of the publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND c.relname = 'users' AND n.nspname = 'public'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;

  END IF;
END $$;

ALTER TABLE public.users REPLICA IDENTITY FULL;
