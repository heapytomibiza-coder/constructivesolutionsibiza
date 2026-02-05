-- Create denormalized search view for instant taxonomy search
-- Joins categories, subcategories, and micro-categories with question pack availability

CREATE OR REPLACE VIEW public.service_search_index AS
SELECT 
  smc.id AS micro_id,
  smc.name AS micro_name,
  smc.slug AS micro_slug,
  ss.id AS subcategory_id,
  ss.name AS subcategory_name,
  sc.id AS category_id,
  sc.name AS category_name,
  -- Concatenated search text for fuzzy matching
  lower(smc.name || ' ' || ss.name || ' ' || sc.name) AS search_text,
  -- Check if question pack exists for this micro
  EXISTS (
    SELECT 1 FROM public.question_packs qp 
    WHERE qp.micro_slug = smc.slug 
    AND qp.is_active = true
  ) AS has_pack
FROM public.service_micro_categories smc
JOIN public.service_subcategories ss ON smc.subcategory_id = ss.id
JOIN public.service_categories sc ON ss.category_id = sc.id
WHERE smc.is_active = true
  AND ss.is_active = true
  AND sc.is_active = true
ORDER BY sc.display_order, ss.display_order, smc.display_order;

-- Enable RLS on the view (public read access)
-- Views inherit from base table RLS, but we want this publicly readable
COMMENT ON VIEW public.service_search_index IS 'Denormalized taxonomy search index for instant service lookup';

-- Create index on micro_categories for faster joins (if not exists)
CREATE INDEX IF NOT EXISTS idx_micro_categories_slug ON public.service_micro_categories(slug);
CREATE INDEX IF NOT EXISTS idx_micro_categories_subcategory ON public.service_micro_categories(subcategory_id) WHERE is_active = true;