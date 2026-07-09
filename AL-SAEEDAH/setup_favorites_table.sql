-- Create the favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL, -- Assuming productId is string/text in the frontend JSON
  product_data jsonb NOT NULL, -- Storing the entire product object so we don't need a separate products table join for now
  created_at timestamp with time zone DEFAULT now()
);

-- Unique index to prevent duplicate favorites per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_favorite ON public.favorites (user_id, product_id);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can read their own favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites" 
ON public.favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
ON public.favorites 
FOR DELETE 
USING (auth.uid() = user_id);
