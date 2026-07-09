-- Enable Realtime for the products table
-- This allows the storefront to receive instant updates when changes are made in the dashboard

-- Step 1: Add the products table to the supabase_realtime publication
-- We use 'ALTER PUBLICATION' to avoid messing with existing publications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;
END $$;

-- Step 2: Ensure the table has a Replica Identity (usually 'DEFAULT' or 'FULL')
-- DEFAULT uses the primary key, which is sufficient for most cases.
ALTER TABLE products REPLICA IDENTITY FULL;
