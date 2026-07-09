-- 1. Remove the foreign key linking orders to profiles
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_user_id_fkey;
    END IF;
END $$;

-- 2. Drop the profiles table entirely
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Drop the store_users table
DROP TABLE IF EXISTS public.store_users CASCADE;

-- 4. (Optional) Clear Auth Users
-- You can manually delete auth.users from the Supabase dashboard if you wish to clean them out.
-- Or run: TRUNCATE auth.users CASCADE; (Be careful! This deletes all old authentication data.)
