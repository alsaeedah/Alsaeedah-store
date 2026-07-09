-- =========================================================================
-- FIX USER LOGIN DATABASE ERROR: "database error querying schema"
-- Run this script in the SQL Editor of your Supabase project.
-- =========================================================================

-- 1. Fix existing user accounts that have NULL columns in auth.users
DO $$
DECLARE
  v_col RECORD;
  v_sql TEXT;
BEGIN
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
    v_sql := format('UPDATE auth.users SET %I = '''' WHERE %I IS NULL', v_col.column_name, v_col.column_name);
    EXECUTE v_sql;
  END LOOP;
END $$;

-- 2. Update the Admin User Creation function to dynamically initialize these columns for new users
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
