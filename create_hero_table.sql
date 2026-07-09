-- 1. Drop existing tables
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.hero CASCADE;

-- 2. Create 'hero' table for dynamic slides
CREATE TABLE public.hero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.hero ENABLE ROW LEVEL SECURITY;

-- 4. Set Policies
-- Allow anyone (public/anon) to read slides
CREATE POLICY "Allow public read access"
ON public.hero
FOR SELECT
USING (true);

-- Allow anyone (including anon for the dashboard) to manage slides
-- Note: In a production app with Supabase Auth, we would restrict this to 'authenticated'
-- but since your dashboard uses a custom login system, we will allow 'anon' access.
CREATE POLICY "Allow public all access"
ON public.hero
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero;
ALTER TABLE public.hero REPLICA IDENTITY FULL;
