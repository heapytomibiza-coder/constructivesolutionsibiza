-- ============================================
-- Electrical Taxonomy Expansion: 5 Subcategories + 25 Micro-services
-- ============================================

DO $$
DECLARE
  v_category_id uuid := '5cd3d75e-4e46-420e-b19d-cc55545e071f';
  v_faults_id uuid;
  v_rewiring_id uuid;
  v_fusebox_id uuid;
  v_lighting_id uuid;
  v_outdoor_id uuid;
BEGIN

  -- ========== INSERT SUBCATEGORIES ==========
  
  INSERT INTO service_subcategories (category_id, slug, name, display_order, is_active)
  VALUES 
    (v_category_id, 'faults-repairs-safety', 'Faults, Repairs & Safety', 10, true),
    (v_category_id, 'rewiring-new-circuits', 'Rewiring & New Circuits', 20, true),
    (v_category_id, 'fuse-boxes-consumer-units', 'Fuse Boxes & Consumer Units', 30, true),
    (v_category_id, 'lighting-power', 'Lighting & Power', 40, true),
    (v_category_id, 'outdoor-external-electrics', 'Outdoor & External Electrics', 50, true)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Get subcategory IDs
  SELECT id INTO v_faults_id FROM service_subcategories WHERE slug = 'faults-repairs-safety' AND category_id = v_category_id;
  SELECT id INTO v_rewiring_id FROM service_subcategories WHERE slug = 'rewiring-new-circuits' AND category_id = v_category_id;
  SELECT id INTO v_fusebox_id FROM service_subcategories WHERE slug = 'fuse-boxes-consumer-units' AND category_id = v_category_id;
  SELECT id INTO v_lighting_id FROM service_subcategories WHERE slug = 'lighting-power' AND category_id = v_category_id;
  SELECT id INTO v_outdoor_id FROM service_subcategories WHERE slug = 'outdoor-external-electrics' AND category_id = v_category_id;

  -- ========== INSERT MICRO-CATEGORIES ==========

  -- Faults, Repairs & Safety (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_faults_id, 'no-power-tripping-circuits', 'No power / tripping circuits', 10, true),
    (v_faults_id, 'fault-finding-repairs', 'Fault finding & repairs', 20, true),
    (v_faults_id, 'socket-switch-repairs', 'Socket & switch repairs', 30, true),
    (v_faults_id, 'electrical-safety-checks-reports', 'Electrical safety checks & reports', 40, true),
    (v_faults_id, 'smoke-heat-alarm-installation', 'Smoke & heat alarm installation', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Rewiring & New Circuits (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_rewiring_id, 'full-house-rewiring', 'Full house rewiring', 10, true),
    (v_rewiring_id, 'partial-rewiring', 'Partial rewiring', 20, true),
    (v_rewiring_id, 'new-circuits-extensions-refits', 'New circuits for extensions & refits', 30, true),
    (v_rewiring_id, 'new-cooker-oven-circuits', 'New cooker / oven circuits', 40, true),
    (v_rewiring_id, 'electric-shower-circuits', 'Electric shower circuits', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Fuse Boxes & Consumer Units (4 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_fusebox_id, 'fuse-box-consumer-unit-replacement', 'Fuse box / consumer unit replacement', 10, true),
    (v_fusebox_id, 'fuse-box-upgrades-rcd-protection', 'Fuse box upgrades & RCD protection', 20, true),
    (v_fusebox_id, 'earthing-bonding-upgrades', 'Earthing & bonding upgrades', 30, true),
    (v_fusebox_id, 'moving-consumer-unit', 'Moving consumer unit', 40, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Lighting & Power (6 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_lighting_id, 'indoor-lighting-installation', 'Indoor lighting installation', 10, true),
    (v_lighting_id, 'outdoor-garden-lighting', 'Outdoor & garden lighting', 20, true),
    (v_lighting_id, 'downlights-spotlights', 'Downlights / spotlights', 30, true),
    (v_lighting_id, 'feature-led-strip-lighting', 'Feature & LED strip lighting', 40, true),
    (v_lighting_id, 'extra-sockets-power-points', 'Extra sockets & power points', 50, true),
    (v_lighting_id, 'dimmer-smart-switch-installation', 'Dimmer & smart switch installation', 60, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Outdoor & External Electrics (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_outdoor_id, 'outdoor-sockets-power-supplies', 'Outdoor sockets & power supplies', 10, true),
    (v_outdoor_id, 'shed-garage-outbuilding-power', 'Shed, garage & outbuilding power', 20, true),
    (v_outdoor_id, 'hot-tub-pool-electrical-supply', 'Hot tub / pool electrical supply', 30, true),
    (v_outdoor_id, 'electric-gates-entrances', 'Electric gates & entrances', 40, true),
    (v_outdoor_id, 'ev-charger-installation', 'EV charger installation', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

END $$;