-- ============================================
-- Construction Taxonomy Expansion: 8 Subcategories + 41 Micro-services
-- ============================================

-- Get construction category ID
DO $$
DECLARE
  v_category_id uuid := '28c4bf36-bd2a-4893-9c0c-359311776023';
  v_foundation_id uuid;
  v_structural_id uuid;
  v_extensions_id uuid;
  v_brickwork_id uuid;
  v_roofing_id uuid;
  v_tiling_id uuid;
  v_outdoor_id uuid;
  v_renovations_id uuid;
BEGIN

  -- ========== INSERT SUBCATEGORIES ==========
  
  INSERT INTO service_subcategories (category_id, slug, name, display_order, is_active)
  VALUES 
    (v_category_id, 'foundation-work', 'Foundation Work', 10, true),
    (v_category_id, 'structural-repairs', 'Structural Repairs', 20, true),
    (v_category_id, 'extensions', 'Extensions', 30, true),
    (v_category_id, 'brickwork-masonry-concrete', 'Brickwork, Masonry & Concrete', 40, true),
    (v_category_id, 'roofing', 'Roofing', 50, true),
    (v_category_id, 'tiling-waterproofing', 'Tiling & Waterproofing', 60, true),
    (v_category_id, 'outdoor-construction', 'Outdoor Construction', 70, true),
    (v_category_id, 'renovations-home-upgrades', 'Renovations & Home Upgrades', 80, true)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Get subcategory IDs
  SELECT id INTO v_foundation_id FROM service_subcategories WHERE slug = 'foundation-work' AND category_id = v_category_id;
  SELECT id INTO v_structural_id FROM service_subcategories WHERE slug = 'structural-repairs' AND category_id = v_category_id;
  SELECT id INTO v_extensions_id FROM service_subcategories WHERE slug = 'extensions' AND category_id = v_category_id;
  SELECT id INTO v_brickwork_id FROM service_subcategories WHERE slug = 'brickwork-masonry-concrete' AND category_id = v_category_id;
  SELECT id INTO v_roofing_id FROM service_subcategories WHERE slug = 'roofing' AND category_id = v_category_id;
  SELECT id INTO v_tiling_id FROM service_subcategories WHERE slug = 'tiling-waterproofing' AND category_id = v_category_id;
  SELECT id INTO v_outdoor_id FROM service_subcategories WHERE slug = 'outdoor-construction' AND category_id = v_category_id;
  SELECT id INTO v_renovations_id FROM service_subcategories WHERE slug = 'renovations-home-upgrades' AND category_id = v_category_id;

  -- ========== INSERT MICRO-CATEGORIES ==========

  -- Foundation Work (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_foundation_id, 'new-foundations', 'New foundations', 10, true),
    (v_foundation_id, 'concrete-base-preparation', 'Concrete base preparation', 20, true),
    (v_foundation_id, 'levelling-uneven-ground', 'Leveling uneven ground', 30, true),
    (v_foundation_id, 'retaining-walls', 'Retaining walls', 40, true),
    (v_foundation_id, 'foundation-drainage', 'Drainage around foundations', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Structural Repairs (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_structural_id, 'repairing-large-cracks', 'Repairing large cracks', 10, true),
    (v_structural_id, 'wall-strengthening', 'Wall strengthening', 20, true),
    (v_structural_id, 'fixing-movement-or-sinking', 'Fixing movement or sinking', 30, true),
    (v_structural_id, 'replacing-structural-elements', 'Replacing damaged structural elements', 40, true),
    (v_structural_id, 'safe-wall-removal-openings', 'Safe wall removal / openings', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Extensions (6 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_extensions_id, 'home-extension-single-floor', 'Home extensions (single floor)', 10, true),
    (v_extensions_id, 'home-extension-two-floors', 'Home extensions (two floors)', 20, true),
    (v_extensions_id, 'adding-new-rooms', 'Adding new rooms', 30, true),
    (v_extensions_id, 'garage-conversions', 'Garage conversions', 40, true),
    (v_extensions_id, 'terrace-rooftop-extensions', 'Terrace or rooftop extensions', 50, true),
    (v_extensions_id, 'conservatories-glass-rooms', 'Conservatories / glass rooms', 60, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Brickwork, Masonry & Concrete (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_brickwork_id, 'building-repairing-walls', 'Building or repairing walls', 10, true),
    (v_brickwork_id, 'garden-boundary-walls', 'Garden / boundary walls', 20, true),
    (v_brickwork_id, 'concrete-bases-paths-floors', 'Concrete bases, paths & floors', 30, true),
    (v_brickwork_id, 'stone-brick-restoration', 'Stone or brick restoration', 40, true),
    (v_brickwork_id, 'rendering-exterior-finishing', 'Rendering & exterior finishing', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Roofing (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_roofing_id, 'roof-repairs', 'Roof repairs', 10, true),
    (v_roofing_id, 'new-roof-installation', 'New roof installation', 20, true),
    (v_roofing_id, 'flat-roofs', 'Flat roofs', 30, true),
    (v_roofing_id, 'roof-waterproofing', 'Waterproofing', 40, true),
    (v_roofing_id, 'guttering-drainage', 'Guttering & drainage', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Tiling & Waterproofing (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_tiling_id, 'floor-tiling', 'Floor tiling', 10, true),
    (v_tiling_id, 'wall-tiling', 'Wall tiling', 20, true),
    (v_tiling_id, 'terrace-waterproofing', 'Terrace waterproofing', 30, true),
    (v_tiling_id, 'regrouting-resealing', 'Re-grouting & re-sealing', 40, true),
    (v_tiling_id, 'shower-wetroom-tiling', 'Shower & wetroom tiling', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Outdoor Construction (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_outdoor_id, 'terraces-patios', 'Terraces & patios', 10, true),
    (v_outdoor_id, 'outdoor-kitchens', 'Outdoor kitchens', 20, true),
    (v_outdoor_id, 'pergolas-gazebos', 'Pergolas & gazebos', 30, true),
    (v_outdoor_id, 'fencing-boundary-structures', 'Fencing & boundary structures', 40, true),
    (v_outdoor_id, 'driveways-pathways', 'Driveways & pathways', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Renovations & Home Upgrades (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_renovations_id, 'full-home-renovation', 'Full home renovation', 10, true),
    (v_renovations_id, 'partial-renovation', 'Partial renovation', 20, true),
    (v_renovations_id, 'open-plan-conversions', 'Open-plan conversions', 30, true),
    (v_renovations_id, 'layout-changes', 'Layout changes', 40, true),
    (v_renovations_id, 'modernisation-upgrades', 'Modernisation & upgrades', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

END $$;