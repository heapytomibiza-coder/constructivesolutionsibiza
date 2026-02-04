/**
 * Pool & Spa Question Packs V2
 * 12 micro-services covering pools, hot tubs, saunas, and spa maintenance
 */

export const poolSpaQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // POOL CONSTRUCTION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "concrete-pools",
    title: "Concrete Pools",
    metadata: { category_contract: "pool-spa", inspection_bias: "high" },
    questions: [
      {
        id: "concrete_pools_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
          { value: "outdoor_area", label: "Outdoor area" },
        ],
      },
      {
        id: "concrete_pools_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_pool_construction", label: "New pool construction" },
          { value: "structural_pool_shell", label: "Structural pool shell" },
          { value: "custom_shape_pool", label: "Custom shape pool" },
        ],
      },
      {
        id: "concrete_pools_03_size",
        label: "Pool size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (up to 20m²)" },
          { value: "medium", label: "Medium (20–40m²)" },
          { value: "large", label: "Large (40m²+)" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "concrete_pools_04_finish",
        label: "Finish type",
        type: "radio",
        required: true,
        options: [
          { value: "standard_concrete", label: "Standard concrete finish" },
          { value: "tiled", label: "Tiled finish" },
          { value: "premium_custom", label: "Premium/custom finish" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "concrete_pools_05_access",
        label: "Site access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "limited", label: "Limited access" },
          { value: "machinery_required", label: "Machinery access required" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "concrete_pools_06_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_1_3_months", label: "Within 1–3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "concrete_pools_07_budget",
        label: "Budget level",
        type: "radio",
        required: false,
        options: [
          { value: "mid_range", label: "Mid-range" },
          { value: "premium", label: "Premium" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "concrete_pools_08_photos",
        label: "Upload plans or references",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
        help: "Optional: share any plans, sketches or inspiration images",
      },
    ],
  },

  {
    microSlug: "fibreglass-pools",
    title: "Fibreglass Pools",
    metadata: { category_contract: "pool-spa", inspection_bias: "high" },
    questions: [
      {
        id: "fibreglass_pools_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
          { value: "outdoor_area", label: "Outdoor area" },
        ],
      },
      {
        id: "fibreglass_pools_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_install", label: "New fibreglass pool install" },
          { value: "replacement", label: "Replacement of existing pool" },
        ],
      },
      {
        id: "fibreglass_pools_03_size",
        label: "Pool size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "fibreglass_pools_04_supply",
        label: "Supply",
        type: "radio",
        required: true,
        options: [
          { value: "already_purchased", label: "Pool already purchased" },
          { value: "supplier_provide", label: "Supplier to provide" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "fibreglass_pools_05_access",
        label: "Site access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "limited", label: "Limited access" },
          { value: "machinery_required", label: "Machinery access required" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "fibreglass_pools_06_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_1_3_months", label: "Within 1–3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "fibreglass_pools_07_photos",
        label: "Upload plans or references",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  {
    microSlug: "infinity-pools",
    title: "Infinity Pools",
    metadata: { category_contract: "pool-spa", inspection_bias: "high" },
    questions: [
      {
        id: "infinity_pools_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
          { value: "outdoor_area", label: "Outdoor area" },
        ],
      },
      {
        id: "infinity_pools_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_infinity", label: "New infinity pool" },
          { value: "conversion", label: "Conversion to infinity edge" },
        ],
      },
      {
        id: "infinity_pools_03_size",
        label: "Pool size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "infinity_pools_04_design",
        label: "Design level",
        type: "radio",
        required: true,
        options: [
          { value: "standard", label: "Standard infinity edge" },
          { value: "custom_architectural", label: "Custom / architectural" },
        ],
      },
      {
        id: "infinity_pools_05_access",
        label: "Site access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "limited", label: "Limited access" },
          { value: "machinery_required", label: "Machinery access required" },
        ],
      },
      {
        id: "infinity_pools_06_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_1_3_months", label: "Within 1–3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "infinity_pools_07_photos",
        label: "Upload plans or references",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POOL MAINTENANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "chemical-balancing",
    title: "Chemical Balancing",
    metadata: { category_contract: "pool-spa", inspection_bias: "low" },
    questions: [
      {
        id: "chemical_balancing_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "chemical_balancing_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_time", label: "One-time balancing" },
          { value: "ongoing", label: "Ongoing maintenance" },
        ],
      },
      {
        id: "chemical_balancing_03_pool_type",
        label: "Pool type",
        type: "radio",
        required: true,
        options: [
          { value: "chlorine", label: "Chlorine" },
          { value: "salt", label: "Salt" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "chemical_balancing_04_size",
        label: "Pool size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "chemical_balancing_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "equipment-service",
    title: "Equipment Service",
    metadata: { category_contract: "pool-spa", inspection_bias: "medium" },
    questions: [
      {
        id: "equipment_service_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "equipment_service_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "pump_service", label: "Pump service" },
          { value: "filter_service", label: "Filter service" },
          { value: "heater_service", label: "Heater service" },
          { value: "full_system_check", label: "Full system check" },
        ],
      },
      {
        id: "equipment_service_03_issue",
        label: "Issue",
        type: "radio",
        required: true,
        options: [
          { value: "not_working", label: "Not working" },
          { value: "reduced_performance", label: "Reduced performance" },
          { value: "routine_service", label: "Routine service" },
        ],
      },
      {
        id: "equipment_service_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "pool-cleaning",
    title: "Pool Cleaning",
    metadata: { category_contract: "pool-spa", inspection_bias: "low" },
    questions: [
      {
        id: "pool_cleaning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "pool_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_off", label: "One-off clean" },
          { value: "regular", label: "Regular cleaning" },
        ],
      },
      {
        id: "pool_cleaning_03_condition",
        label: "Pool condition",
        type: "radio",
        required: true,
        options: [
          { value: "light_dirt", label: "Light dirt" },
          { value: "heavy_dirt_algae", label: "Heavy dirt / algae" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "pool_cleaning_04_size",
        label: "Pool size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "pool_cleaning_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POOL REPAIRS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "pool-deck-repair",
    title: "Pool Deck Repair",
    metadata: { category_contract: "pool-spa", inspection_bias: "medium" },
    questions: [
      {
        id: "pool_deck_repair_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "pool_deck_repair_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "crack_repair", label: "Crack repair" },
          { value: "surface_replacement", label: "Surface replacement" },
          { value: "structural_repair", label: "Structural repair" },
        ],
      },
      {
        id: "pool_deck_repair_03_size",
        label: "Deck size",
        type: "radio",
        required: true,
        options: [
          { value: "small_area", label: "Small area" },
          { value: "medium_area", label: "Medium area" },
          { value: "large_area", label: "Large area" },
        ],
      },
      {
        id: "pool_deck_repair_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "pool_deck_repair_05_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "pool-resurfacing",
    title: "Pool Resurfacing",
    metadata: { category_contract: "pool-spa", inspection_bias: "high" },
    questions: [
      {
        id: "pool_resurfacing_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "pool_resurfacing_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "full_resurfacing", label: "Full resurfacing" },
          { value: "patch_repair", label: "Patch repair" },
        ],
      },
      {
        id: "pool_resurfacing_03_finish",
        label: "Finish type",
        type: "radio",
        required: true,
        options: [
          { value: "standard", label: "Standard" },
          { value: "premium", label: "Premium" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "pool_resurfacing_04_size",
        label: "Pool size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "pool_resurfacing_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_month", label: "Within 1 month" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "pool_resurfacing_06_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "tile-replacement",
    title: "Tile Replacement",
    metadata: { category_contract: "pool-spa", inspection_bias: "medium" },
    questions: [
      {
        id: "tile_replacement_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "tile_replacement_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "pool_wall_tiles", label: "Pool wall tiles" },
          { value: "pool_edge_tiles", label: "Pool edge tiles" },
          { value: "full_retile", label: "Full retile" },
        ],
      },
      {
        id: "tile_replacement_03_area",
        label: "Area",
        type: "radio",
        required: true,
        options: [
          { value: "small_section", label: "Small section" },
          { value: "half_pool", label: "Half pool" },
          { value: "full_pool", label: "Full pool" },
        ],
      },
      {
        id: "tile_replacement_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_month", label: "Within 1 month" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "tile_replacement_05_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SPA FACILITIES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "hot-tub-installation",
    title: "Hot Tub Installation",
    metadata: { category_contract: "pool-spa", inspection_bias: "medium" },
    questions: [
      {
        id: "hot_tub_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "hot_tub_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_installation", label: "New installation" },
          { value: "replacement", label: "Replacement" },
        ],
      },
      {
        id: "hot_tub_03_placement",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "indoor", label: "Indoor" },
          { value: "outdoor", label: "Outdoor" },
        ],
      },
      {
        id: "hot_tub_04_electrical",
        label: "Electrical ready",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "hot_tub_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_month", label: "Within 1 month" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "sauna-installation",
    title: "Sauna Installation",
    metadata: { category_contract: "pool-spa", inspection_bias: "medium" },
    questions: [
      {
        id: "sauna_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "sauna_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "indoor", label: "Indoor sauna" },
          { value: "outdoor", label: "Outdoor sauna" },
        ],
      },
      {
        id: "sauna_03_type",
        label: "Sauna type",
        type: "radio",
        required: true,
        options: [
          { value: "traditional", label: "Traditional" },
          { value: "infrared", label: "Infrared" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "sauna_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_month", label: "Within 1 month" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "spa-maintenance",
    title: "Spa Maintenance",
    metadata: { category_contract: "pool-spa", inspection_bias: "low" },
    questions: [
      {
        id: "spa_maintenance_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial_property", label: "Commercial property" },
        ],
      },
      {
        id: "spa_maintenance_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_time", label: "One-time service" },
          { value: "ongoing", label: "Ongoing maintenance" },
        ],
      },
      {
        id: "spa_maintenance_03_issue",
        label: "Issue",
        type: "radio",
        required: true,
        options: [
          { value: "water_quality", label: "Water quality" },
          { value: "heating", label: "Heating" },
          { value: "jets_pumps", label: "Jets / pumps" },
        ],
      },
      {
        id: "spa_maintenance_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },
];
