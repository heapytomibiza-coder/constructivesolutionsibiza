-- Add missing subcategories and micro-services to support V1 strong packs
-- Phase 1: Add missing subcategories

-- Add 'Fitted Wardrobes' subcategory under Carpentry
INSERT INTO service_subcategories (category_id, name, slug, description, is_active)
SELECT 
  sc.id,
  'Fitted Wardrobes',
  'fitted-wardrobes',
  'Custom built-in wardrobes and storage solutions',
  true
FROM service_categories sc
WHERE sc.slug = 'carpentry'
  AND NOT EXISTS (SELECT 1 FROM service_subcategories WHERE slug = 'fitted-wardrobes');

-- Add 'Bespoke Joinery' subcategory under Carpentry
INSERT INTO service_subcategories (category_id, name, slug, description, is_active)
SELECT 
  sc.id,
  'Bespoke Joinery',
  'bespoke-joinery',
  'Custom staircases, doors, and architectural woodwork',
  true
FROM service_categories sc
WHERE sc.slug = 'carpentry'
  AND NOT EXISTS (SELECT 1 FROM service_subcategories WHERE slug = 'bespoke-joinery');

-- Add 'Emergency Plumbing' subcategory under Plumbing
INSERT INTO service_subcategories (category_id, name, slug, description, is_active)
SELECT 
  sc.id,
  'Emergency Plumbing',
  'emergency-plumbing',
  'Urgent plumbing repairs and emergencies',
  true
FROM service_categories sc
WHERE sc.slug = 'plumbing'
  AND NOT EXISTS (SELECT 1 FROM service_subcategories WHERE slug = 'emergency-plumbing');

-- Add 'Drainage' subcategory under Plumbing
INSERT INTO service_subcategories (category_id, name, slug, description, is_active)
SELECT 
  sc.id,
  'Drainage',
  'drainage',
  'Drain clearing, sewer systems, and drainage solutions',
  true
FROM service_categories sc
WHERE sc.slug = 'plumbing'
  AND NOT EXISTS (SELECT 1 FROM service_subcategories WHERE slug = 'drainage');

-- Add 'Hot Water Systems' subcategory under Plumbing
INSERT INTO service_subcategories (category_id, name, slug, description, is_active)
SELECT 
  sc.id,
  'Hot Water Systems',
  'hot-water-systems',
  'Water heaters, boilers, and hot water solutions',
  true
FROM service_categories sc
WHERE sc.slug = 'plumbing'
  AND NOT EXISTS (SELECT 1 FROM service_subcategories WHERE slug = 'hot-water-systems');

-- Phase 2: Add missing micro-services

-- Carpentry > Fitted Wardrobes > Sliding door wardrobes
INSERT INTO service_micro_categories (subcategory_id, name, slug, description, is_active)
SELECT 
  ssc.id,
  'Sliding door wardrobes',
  'sliding-door-wardrobes',
  'Custom sliding door wardrobe installation',
  true
FROM service_subcategories ssc
WHERE ssc.slug = 'fitted-wardrobes'
  AND NOT EXISTS (SELECT 1 FROM service_micro_categories WHERE slug = 'sliding-door-wardrobes');

-- Carpentry > Custom Furniture > Bespoke tables
INSERT INTO service_micro_categories (subcategory_id, name, slug, description, is_active)
SELECT 
  ssc.id,
  'Bespoke tables',
  'bespoke-tables',
  'Custom-made dining tables, coffee tables, and desks',
  true
FROM service_subcategories ssc
WHERE ssc.slug = 'custom-furniture'
  AND NOT EXISTS (SELECT 1 FROM service_micro_categories WHERE slug = 'bespoke-tables');

-- Carpentry > Bespoke Joinery > Staircases & handrails
INSERT INTO service_micro_categories (subcategory_id, name, slug, description, is_active)
SELECT 
  ssc.id,
  'Staircases & handrails',
  'staircases-handrails',
  'Custom staircase construction and handrail installation',
  true
FROM service_subcategories ssc
WHERE ssc.slug = 'bespoke-joinery'
  AND NOT EXISTS (SELECT 1 FROM service_micro_categories WHERE slug = 'staircases-handrails');

-- Plumbing > Emergency Plumbing > Burst pipe
INSERT INTO service_micro_categories (subcategory_id, name, slug, description, is_active)
SELECT 
  ssc.id,
  'Burst pipe repair',
  'burst-pipe',
  'Emergency burst pipe repairs',
  true
FROM service_subcategories ssc
WHERE ssc.slug = 'emergency-plumbing'
  AND NOT EXISTS (SELECT 1 FROM service_micro_categories WHERE slug = 'burst-pipe');

-- Plumbing > Drainage > Sewer backup
INSERT INTO service_micro_categories (subcategory_id, name, slug, description, is_active)
SELECT 
  ssc.id,
  'Sewer backup',
  'sewer-backup',
  'Sewer backup clearing and repairs',
  true
FROM service_subcategories ssc
WHERE ssc.slug = 'drainage'
  AND NOT EXISTS (SELECT 1 FROM service_micro_categories WHERE slug = 'sewer-backup');

-- Plumbing > Hot Water Systems > Water heater emergency
INSERT INTO service_micro_categories (subcategory_id, name, slug, description, is_active)
SELECT 
  ssc.id,
  'Water heater emergency',
  'water-heater-emergency',
  'Emergency water heater repairs and replacements',
  true
FROM service_subcategories ssc
WHERE ssc.slug = 'hot-water-systems'
  AND NOT EXISTS (SELECT 1 FROM service_micro_categories WHERE slug = 'water-heater-emergency');