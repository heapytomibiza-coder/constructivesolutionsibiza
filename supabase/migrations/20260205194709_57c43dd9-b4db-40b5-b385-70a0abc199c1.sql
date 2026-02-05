-- Recreate view with security_invoker to fix Security Definer warning
DROP VIEW IF EXISTS public.service_search_index;

CREATE VIEW public.service_search_index 
WITH (security_invoker = true) AS
SELECT 
  smc.id AS micro_id,
  smc.name AS micro_name,
  smc.slug AS micro_slug,
  ss.id AS subcategory_id,
  ss.name AS subcategory_name,
  sc.id AS category_id,
  sc.name AS category_name,
  lower(smc.name || ' ' || ss.name || ' ' || sc.name) AS search_text,
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

COMMENT ON VIEW public.service_search_index IS 'Denormalized taxonomy search index for instant service lookup';