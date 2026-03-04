
-- Create new subcategory "Floor & Surface Finishes" under "Floors, Doors & Windows"
INSERT INTO public.service_subcategories (category_id, name, slug, display_order, is_active)
VALUES (
  'e5c46792-eaa2-4b30-80ca-5671377b11d9',
  'Floor & Surface Finishes',
  'floor-surface-finishes',
  5,
  true
);

-- Create micro "Microcement Installation" under the new subcategory
INSERT INTO public.service_micro_categories (subcategory_id, name, slug, description, display_order, is_active)
SELECT id, 'Microcement Installation', 'microcement-installation', 'Professional microcement application for floors, walls, and wet areas', 1, true
FROM public.service_subcategories WHERE slug = 'floor-surface-finishes';
