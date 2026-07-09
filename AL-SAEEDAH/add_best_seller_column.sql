-- Add is_best_seller column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;

-- Add index for performance optimization when filtering best sellers
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON products(is_best_seller) WHERE is_best_seller = true;
