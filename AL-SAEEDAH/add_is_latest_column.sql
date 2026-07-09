-- Add is_latest column to products table to support the manual "Latest Products" section
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT false;

-- Add an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_is_latest ON public.products(is_latest) WHERE is_latest = true;
