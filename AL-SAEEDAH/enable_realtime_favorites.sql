-- ==============================================================================
-- REAL-TIME SYNC FOR FAVORITES TABLE
-- Run this script in your Supabase SQL Editor to enable real-time synchronization
-- for customer Favorites across tabs/devices.
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

-- 2. Enable Real-Time for Favorites Table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'favorites'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE favorites;
    END IF;
END $$;

-- 3. Set Replica Identity to FULL for Favorites Table
-- This is critical so that DELETE event payloads contain all columns (user_id, product_id)
-- rather than just the primary key ID.
ALTER TABLE public.favorites REPLICA IDENTITY FULL;

-- Done!
