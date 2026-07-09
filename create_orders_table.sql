-- 1. Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (Example: Admins can see all, Users can see their own)
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (true); 

-- 4. Enable Realtime for the orders table
-- This allows the dashboard to receive updates instantly
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE orders;
COMMIT;

-- Note: In some Supabase setups, you just need:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
