-- ==============================================================================
-- REAL-TIME FEATURES SETUP FOR SUPABASE
-- Run this script in your Supabase SQL Editor to enable real-time updates 
-- for Products, Orders, and Hero Slides.
-- ==============================================================================

-- 1. Ensure the supabase_realtime publication exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;

-- 2. Enable Real-Time for Products Table
-- (handles add/edit/remove product & add/remove from best sellers and newest)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;
END $$;

ALTER TABLE products REPLICA IDENTITY FULL;

-- 3. Enable Real-Time for Orders Table
-- (handles receive order in real-time)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;

ALTER TABLE orders REPLICA IDENTITY FULL;

-- 4. Enable Real-Time for Hero Table
-- (handles add/remove slide in real-time)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'hero'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE hero;
    END IF;
END $$;

ALTER TABLE hero REPLICA IDENTITY FULL;

-- Done! Real-time features are now fully enabled.
