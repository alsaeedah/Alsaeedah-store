-- Enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if any (optional, be careful)
-- DROP POLICY IF EXISTS "Users can view their own data" ON users;
-- DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create policy to allow users to ONLY see their own record
CREATE POLICY "Users can view their own data" 
ON users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- If you want to prevent ALL access via the API to the users table (even for self)
-- You can comment out the above and use:
-- CREATE POLICY "No one can fetch users via API" ON users FOR SELECT USING (false);

-- NOTE: Dashboard (admin) access: 
-- If the dashboard uses the Service Role Key, it will bypass RLS.
-- If the dashboard uses the Anon/Authenticated Key, it will now be restricted by this policy.
-- To ensure the dashboard can't see other users, make sure it's not using the Service Role Key for this specific fetch.
