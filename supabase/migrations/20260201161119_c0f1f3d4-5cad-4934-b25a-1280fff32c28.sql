-- ============================================
-- HVAC Taxonomy Expansion: 5 Subcategories + 21 Micro-services
-- ============================================

DO $$
DECLARE
  v_category_id uuid := '61d8fc25-954f-419a-830d-fa393657a368';
  v_ac_install_id uuid;
  v_ac_service_id uuid;
  v_heating_id uuid;
  v_ventilation_id uuid;
  v_controls_id uuid;
BEGIN

  -- ========== INSERT SUBCATEGORIES ==========
  
  INSERT INTO service_subcategories (category_id, slug, name, display_order, is_active)
  VALUES 
    (v_category_id, 'ac-installation-upgrade', 'AC Installation & Upgrade', 10, true),
    (v_category_id, 'ac-servicing-repairs', 'AC Servicing & Repairs', 20, true),
    (v_category_id, 'heating-systems', 'Heating Systems', 30, true),
    (v_category_id, 'ventilation-air-quality', 'Ventilation & Air Quality', 40, true),
    (v_category_id, 'controls-efficiency', 'Controls & Efficiency', 50, true)
  ON CONFLICT (category_id, slug) DO NOTHING;

  -- Get subcategory IDs
  SELECT id INTO v_ac_install_id FROM service_subcategories WHERE slug = 'ac-installation-upgrade' AND category_id = v_category_id;
  SELECT id INTO v_ac_service_id FROM service_subcategories WHERE slug = 'ac-servicing-repairs' AND category_id = v_category_id;
  SELECT id INTO v_heating_id FROM service_subcategories WHERE slug = 'heating-systems' AND category_id = v_category_id;
  SELECT id INTO v_ventilation_id FROM service_subcategories WHERE slug = 'ventilation-air-quality' AND category_id = v_category_id;
  SELECT id INTO v_controls_id FROM service_subcategories WHERE slug = 'controls-efficiency' AND category_id = v_category_id;

  -- ========== INSERT MICRO-CATEGORIES ==========

  -- AC Installation & Upgrade (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_ac_install_id, 'wall-split-ac-installation', 'Wall split AC installation', 10, true),
    (v_ac_install_id, 'multi-split-ac-installation', 'Multi-split AC installation', 20, true),
    (v_ac_install_id, 'ducted-ac-installation', 'Ducted AC installation', 30, true),
    (v_ac_install_id, 'ac-relocation', 'AC unit relocation', 40, true),
    (v_ac_install_id, 'ac-upgrade-replacement', 'AC system upgrade or replacement', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- AC Servicing & Repairs (5 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_ac_service_id, 'regular-ac-servicing', 'Regular AC servicing', 10, true),
    (v_ac_service_id, 'ac-emergency-repair', 'AC emergency repair', 20, true),
    (v_ac_service_id, 'ac-gas-recharge', 'AC gas recharge', 30, true),
    (v_ac_service_id, 'ac-leak-detection-repair', 'AC leak detection & repair', 40, true),
    (v_ac_service_id, 'ac-poor-performance-noise', 'AC poor performance / noise issues', 50, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Heating Systems (4 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_heating_id, 'heat-pump-installation', 'Heat pump installation', 10, true),
    (v_heating_id, 'underfloor-heating-installation', 'Underfloor heating installation', 20, true),
    (v_heating_id, 'radiator-system-installation', 'Radiator system installation', 30, true),
    (v_heating_id, 'heating-system-servicing-repair', 'Heating system servicing & repair', 40, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Ventilation & Air Quality (4 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_ventilation_id, 'mechanical-ventilation-install', 'Mechanical ventilation installation', 10, true),
    (v_ventilation_id, 'kitchen-extractor-installation', 'Kitchen extractor installation', 20, true),
    (v_ventilation_id, 'bathroom-extractor-installation', 'Bathroom extractor installation', 30, true),
    (v_ventilation_id, 'air-purifier-filter-systems', 'Air purifier & filter systems', 40, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

  -- Controls & Efficiency (3 micros)
  INSERT INTO service_micro_categories (subcategory_id, slug, name, display_order, is_active)
  VALUES
    (v_controls_id, 'smart-thermostat-installation', 'Smart thermostat installation', 10, true),
    (v_controls_id, 'zoning-and-controls', 'Zoning & control systems', 20, true),
    (v_controls_id, 'energy-efficiency-assessment', 'Energy efficiency assessment', 30, true)
  ON CONFLICT (slug) WHERE is_active = true DO NOTHING;

END $$;