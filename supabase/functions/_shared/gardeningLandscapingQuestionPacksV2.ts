/**
 * Gardening & Landscaping Question Packs V2
 * 14 micro-services covering garden design, irrigation, lawn care, and maintenance
 */

export const gardeningLandscapingQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // GARDEN DESIGN
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "create-garden-plan",
    title: "Create Garden Plan",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "create_garden_plan_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "create_garden_plan_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_garden", label: "New garden design" },
          { value: "redesign", label: "Redesign existing garden" },
        ],
      },
      {
        id: "create_garden_plan_03_size",
        label: "Garden size",
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
        id: "create_garden_plan_04_style",
        label: "Style preference",
        type: "radio",
        required: true,
        options: [
          { value: "low_maintenance", label: "Low maintenance" },
          { value: "mediterranean", label: "Mediterranean" },
          { value: "modern", label: "Modern" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "create_garden_plan_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "create_garden_plan_06_budget",
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
        id: "create_garden_plan_07_photos",
        label: "Upload site photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "garden-planning",
    title: "Garden Planning",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "garden_planning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "garden_planning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "layout_planning", label: "Layout planning" },
          { value: "plant_planning", label: "Plant planning" },
          { value: "full_garden_plan", label: "Full garden plan" },
        ],
      },
      {
        id: "garden_planning_03_size",
        label: "Area size",
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
        id: "garden_planning_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "garden_planning_05_photos",
        label: "Upload site photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "hardscaping",
    title: "Hardscaping",
    metadata: { category_contract: "gardening", inspection_bias: "high" },
    questions: [
      {
        id: "hardscaping_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "hardscaping_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "pathways", label: "Pathways" },
          { value: "terraces", label: "Terraces" },
          { value: "retaining_walls", label: "Retaining walls" },
          { value: "multiple_elements", label: "Multiple elements" },
        ],
      },
      {
        id: "hardscaping_03_size",
        label: "Area size",
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
        id: "hardscaping_04_timeline",
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
        id: "hardscaping_05_photos",
        label: "Upload site photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "install-irrigation",
    title: "Install Irrigation",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "install_irrigation_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "install_irrigation_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_system", label: "New irrigation system" },
          { value: "upgrade_existing", label: "Upgrade existing system" },
        ],
      },
      {
        id: "install_irrigation_03_coverage",
        label: "Area covered",
        type: "radio",
        required: true,
        options: [
          { value: "garden_beds", label: "Garden beds" },
          { value: "lawn", label: "Lawn" },
          { value: "full_garden", label: "Full garden" },
        ],
      },
      {
        id: "install_irrigation_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "planting-schemes",
    title: "Planting Schemes",
    metadata: { category_contract: "gardening", inspection_bias: "low" },
    questions: [
      {
        id: "planting_schemes_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "planting_schemes_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "decorative", label: "Decorative planting" },
          { value: "functional", label: "Functional planting" },
          { value: "full_garden", label: "Full garden planting" },
        ],
      },
      {
        id: "planting_schemes_03_size",
        label: "Area size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "planting_schemes_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // IRRIGATION SYSTEMS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "drip-irrigation",
    title: "Drip Irrigation",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "drip_irrigation_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "drip_irrigation_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_system", label: "New system" },
          { value: "extension", label: "Extension of existing" },
        ],
      },
      {
        id: "drip_irrigation_03_coverage",
        label: "Coverage",
        type: "radio",
        required: true,
        options: [
          { value: "partial_garden", label: "Partial garden" },
          { value: "full_garden", label: "Full garden" },
        ],
      },
      {
        id: "drip_irrigation_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "irrigation-repair",
    title: "Irrigation Repair",
    metadata: { category_contract: "gardening", inspection_bias: "low" },
    questions: [
      {
        id: "irrigation_repair_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "irrigation_repair_02_issue",
        label: "Issue",
        type: "radio",
        required: true,
        options: [
          { value: "leaks", label: "Leaks" },
          { value: "blockages", label: "Blockages" },
          { value: "not_working", label: "System not working" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "irrigation_repair_03_area",
        label: "Area affected",
        type: "radio",
        required: true,
        options: [
          { value: "small_section", label: "Small section" },
          { value: "large_area", label: "Large area" },
        ],
      },
      {
        id: "irrigation_repair_04_timeline",
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
    microSlug: "sprinkler-installation",
    title: "Sprinkler Installation",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "sprinkler_install_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "sprinkler_install_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_installation", label: "New installation" },
          { value: "replacement", label: "Replacement" },
        ],
      },
      {
        id: "sprinkler_install_03_area",
        label: "Area",
        type: "radio",
        required: true,
        options: [
          { value: "lawn_only", label: "Lawn only" },
          { value: "garden_and_lawn", label: "Garden & lawn" },
        ],
      },
      {
        id: "sprinkler_install_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LAWN CARE
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "lawn-treatment",
    title: "Lawn Treatment",
    metadata: { category_contract: "gardening", inspection_bias: "low" },
    questions: [
      {
        id: "lawn_treatment_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "lawn_treatment_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "fertilising", label: "Fertilising" },
          { value: "weed_control", label: "Weed control" },
          { value: "lawn_recovery", label: "Lawn recovery" },
        ],
      },
      {
        id: "lawn_treatment_03_size",
        label: "Lawn size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "lawn_treatment_04_timeline",
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
    microSlug: "turf-installation",
    title: "Turf Installation",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "turf_installation_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "turf_installation_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_turf", label: "New turf" },
          { value: "replace_existing", label: "Replace existing lawn" },
        ],
      },
      {
        id: "turf_installation_03_size",
        label: "Area size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "turf_installation_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MAINTENANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "hedge-trimming",
    title: "Hedge Trimming",
    metadata: { category_contract: "gardening", inspection_bias: "low" },
    questions: [
      {
        id: "hedge_trimming_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "hedge_trimming_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "light_trim", label: "Light trim" },
          { value: "heavy_cut_back", label: "Heavy cut-back" },
        ],
      },
      {
        id: "hedge_trimming_03_length",
        label: "Hedge length",
        type: "radio",
        required: true,
        options: [
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "long", label: "Long" },
        ],
      },
      {
        id: "hedge_trimming_04_timeline",
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
    microSlug: "lawn-mowing",
    title: "Lawn Mowing",
    metadata: { category_contract: "gardening", inspection_bias: "low" },
    questions: [
      {
        id: "lawn_mowing_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "lawn_mowing_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_off", label: "One-off mow" },
          { value: "regular", label: "Regular maintenance" },
        ],
      },
      {
        id: "lawn_mowing_03_size",
        label: "Lawn size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "lawn_mowing_04_timeline",
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
    microSlug: "tree-pruning",
    title: "Tree Pruning",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "tree_pruning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "tree_pruning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "light_pruning", label: "Light pruning" },
          { value: "heavy_pruning", label: "Heavy pruning" },
        ],
      },
      {
        id: "tree_pruning_03_size",
        label: "Tree size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "tree_pruning_04_timeline",
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
  // TREE & HEDGE CARE
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "tree-removal",
    title: "Tree Removal",
    metadata: { category_contract: "gardening", inspection_bias: "high" },
    questions: [
      {
        id: "tree_removal_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "tree_removal_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_tree", label: "Single tree" },
          { value: "multiple_trees", label: "Multiple trees" },
        ],
      },
      {
        id: "tree_removal_03_size",
        label: "Tree size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "tree_removal_04_access",
        label: "Access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "restricted", label: "Restricted access" },
        ],
      },
      {
        id: "tree_removal_05_timeline",
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
  // ADDITIONAL SERVICES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "turf-installation",
    title: "Turf Installation",
    metadata: { category_contract: "gardening", inspection_bias: "medium" },
    questions: [
      {
        id: "turf_installation_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "turf_installation_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_lawn", label: "New lawn installation" },
          { value: "replace_existing", label: "Replace existing lawn" },
          { value: "extend_lawn", label: "Extend existing lawn" },
        ],
      },
      {
        id: "turf_installation_03_size",
        label: "Area size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (under 50m²)" },
          { value: "medium", label: "Medium (50–150m²)" },
          { value: "large", label: "Large (150m²+)" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "turf_installation_04_prep",
        label: "Ground preparation",
        type: "radio",
        required: true,
        options: [
          { value: "needs_clearing", label: "Needs clearing" },
          { value: "already_prepared", label: "Already prepared" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "turf_installation_05_irrigation",
        label: "Irrigation",
        type: "radio",
        required: true,
        options: [
          { value: "have_irrigation", label: "Have irrigation system" },
          { value: "need_irrigation", label: "Need irrigation installed" },
          { value: "manual_watering", label: "Will water manually" },
        ],
      },
      {
        id: "turf_installation_06_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },
];
