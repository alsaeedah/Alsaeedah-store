-- 1. Remove the old trigger that causes the "Database error saving new user" bug
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remove the old function that was trying to insert into the deleted 'profiles' table
DROP FUNCTION IF EXISTS public.handle_new_user();
