-- Final fix for stable random sorting
-- First, drop the old version to avoid "cannot change return type" error
DROP FUNCTION IF EXISTS get_random_products(text,int,int,text,text,numeric,numeric,text);

-- Now create the improved robust version
CREATE OR REPLACE FUNCTION get_random_products(
  p_seed TEXT,
  p_offset INT,
  p_limit INT,
  p_category TEXT DEFAULT 'all',
  p_style TEXT DEFAULT 'all',
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_search TEXT DEFAULT NULL
) RETURNS SETOF products 
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE
    (p_category = 'all' OR category = p_category) AND
    (p_style = 'all' OR style = p_style) AND
    (p_min_price IS NULL OR price >= p_min_price) AND
    (p_max_price IS NULL OR price <= p_max_price) AND
    (p_search IS NULL OR (name ILIKE '%' || p_search || '%' OR "displayId" ILIKE '%' || p_search || '%'))
  ORDER BY MD5(id::TEXT || p_seed)
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant access to all roles
GRANT EXECUTE ON FUNCTION get_random_products(TEXT, INT, INT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO public;
GRANT EXECUTE ON FUNCTION get_random_products(TEXT, INT, INT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_random_products(TEXT, INT, INT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated;
