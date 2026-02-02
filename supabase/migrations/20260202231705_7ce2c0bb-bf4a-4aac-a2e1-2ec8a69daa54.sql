-- Add V1 Kitchen & Bathroom micro-services to enable strong pack seeding
-- Following taxonomy-slug-policy: preserve V1 slugs exactly

-- Add kitchen-fitting to kitchen-installation subcategory
INSERT INTO service_micro_categories (subcategory_id, slug, name, description, display_order, is_active)
VALUES (
  '023d8cbf-13f2-4c5b-8ad4-75d579a22fca',
  'kitchen-fitting',
  'Kitchen fitting',
  'Full kitchen fitting including units, worktops, and appliance installation',
  10,
  true
)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Add bathroom-design to bathroom-installation subcategory
INSERT INTO service_micro_categories (subcategory_id, slug, name, description, display_order, is_active)
VALUES (
  '10ca62b0-2771-43b5-a9f9-6a5928716a35',
  'bathroom-design',
  'Bathroom design',
  'Complete bathroom design and installation service',
  10,
  true
)
ON CONFLICT (subcategory_id, slug) DO NOTHING;

-- Add wetroom-installation to bathroom-installation subcategory
INSERT INTO service_micro_categories (subcategory_id, slug, name, description, display_order, is_active)
VALUES (
  '10ca62b0-2771-43b5-a9f9-6a5928716a35',
  'wetroom-installation',
  'Wetroom installation',
  'Specialist wetroom design and installation',
  11,
  true
)
ON CONFLICT (subcategory_id, slug) DO NOTHING;