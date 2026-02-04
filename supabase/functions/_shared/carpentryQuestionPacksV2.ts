/**
 * Carpentry Question Packs V2
 * 23 micro-services covering bespoke joinery, custom furniture, doors/windows, structural, decking, and restoration
 */

export const carpentryQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // BESPOKE JOINERY
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "staircases-handrails",
    title: "Staircases & Handrails",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "staircases_handrails_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "apartment", label: "Apartment" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "staircases_handrails_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_staircase", label: "New staircase" },
          { value: "replace_existing", label: "Replace existing" },
          { value: "handrails_only", label: "Handrails only" },
          { value: "repair", label: "Repair existing" },
        ],
      },
      {
        id: "staircases_handrails_03_material",
        label: "Material preference",
        type: "radio",
        required: true,
        options: [
          { value: "hardwood", label: "Hardwood" },
          { value: "softwood", label: "Softwood" },
          { value: "metal_wood_combo", label: "Metal & wood combo" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "staircases_handrails_04_floors",
        label: "Number of floors",
        type: "radio",
        required: true,
        options: [
          { value: "single_flight", label: "Single flight" },
          { value: "two_floors", label: "Two floors" },
          { value: "three_plus", label: "Three floors+" },
        ],
      },
      {
        id: "staircases_handrails_05_access",
        label: "Site access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "limited", label: "Limited access" },
          { value: "restricted", label: "Restricted access" },
        ],
      },
      {
        id: "staircases_handrails_06_timeline",
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
        id: "staircases_handrails_07_photos",
        label: "Upload photos / plans",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FITTED WARDROBES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "sliding-door-wardrobes",
    title: "Sliding Door Wardrobes",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "sliding_wardrobes_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "bedroom", label: "Bedroom" },
          { value: "hallway", label: "Hallway" },
          { value: "dressing_room", label: "Dressing room" },
        ],
      },
      {
        id: "sliding_wardrobes_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_installation", label: "New installation" },
          { value: "replace_existing", label: "Replace existing" },
        ],
      },
      {
        id: "sliding_wardrobes_03_size",
        label: "Approximate width",
        type: "radio",
        required: true,
        options: [
          { value: "up_to_2m", label: "Up to 2m" },
          { value: "2m_to_4m", label: "2m – 4m" },
          { value: "over_4m", label: "Over 4m" },
        ],
      },
      {
        id: "sliding_wardrobes_04_finish",
        label: "Finish preference",
        type: "radio",
        required: true,
        options: [
          { value: "painted", label: "Painted" },
          { value: "natural_wood", label: "Natural wood" },
          { value: "mirrored", label: "Mirrored" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "sliding_wardrobes_05_timeline",
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

  // ─────────────────────────────────────────────────────────────────────────
  // CUSTOM FURNITURE
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "bespoke-tables",
    title: "Bespoke Tables",
    metadata: { category_contract: "carpentry", inspection_bias: "low" },
    questions: [
      {
        id: "bespoke_tables_01_type",
        label: "Table type",
        type: "radio",
        required: true,
        options: [
          { value: "dining", label: "Dining table" },
          { value: "coffee", label: "Coffee table" },
          { value: "console", label: "Console table" },
          { value: "outdoor", label: "Outdoor table" },
        ],
      },
      {
        id: "bespoke_tables_02_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "hardwood", label: "Hardwood" },
          { value: "reclaimed", label: "Reclaimed wood" },
          { value: "wood_metal", label: "Wood & metal" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "bespoke_tables_03_size",
        label: "Seating capacity",
        type: "radio",
        required: true,
        options: [
          { value: "2_4_people", label: "2–4 people" },
          { value: "6_8_people", label: "6–8 people" },
          { value: "10_plus", label: "10+ people" },
        ],
      },
      {
        id: "bespoke_tables_04_timeline",
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
        id: "bespoke_tables_05_photos",
        label: "Upload reference images",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  {
    microSlug: "dining-tables",
    title: "Dining Tables",
    metadata: { category_contract: "carpentry", inspection_bias: "low" },
    questions: [
      {
        id: "dining_tables_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "custom_build", label: "Custom build" },
          { value: "repair", label: "Repair existing" },
          { value: "refinish", label: "Refinish existing" },
        ],
      },
      {
        id: "dining_tables_02_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "solid_wood", label: "Solid wood" },
          { value: "reclaimed", label: "Reclaimed wood" },
          { value: "wood_metal", label: "Wood & metal" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "dining_tables_03_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "4_seater", label: "4 seater" },
          { value: "6_seater", label: "6 seater" },
          { value: "8_plus_seater", label: "8+ seater" },
        ],
      },
      {
        id: "dining_tables_04_timeline",
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
    microSlug: "shelving-units",
    title: "Shelving Units",
    metadata: { category_contract: "carpentry", inspection_bias: "low" },
    questions: [
      {
        id: "shelving_units_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "living_room", label: "Living room" },
          { value: "bedroom", label: "Bedroom" },
          { value: "office", label: "Office" },
          { value: "garage", label: "Garage" },
        ],
      },
      {
        id: "shelving_units_02_type",
        label: "Type",
        type: "radio",
        required: true,
        options: [
          { value: "floating", label: "Floating shelves" },
          { value: "freestanding", label: "Freestanding unit" },
          { value: "built_in", label: "Built-in" },
        ],
      },
      {
        id: "shelving_units_03_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (under 1m)" },
          { value: "medium", label: "Medium (1–2m)" },
          { value: "large", label: "Large (over 2m)" },
        ],
      },
      {
        id: "shelving_units_04_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "solid_wood", label: "Solid wood" },
          { value: "mdf_painted", label: "MDF (painted)" },
          { value: "wood_metal", label: "Wood & metal" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "shelving_units_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "wardrobes",
    title: "Wardrobes",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "wardrobes_01_type",
        label: "Type",
        type: "radio",
        required: true,
        options: [
          { value: "fitted", label: "Fitted wardrobe" },
          { value: "freestanding", label: "Freestanding" },
          { value: "walk_in", label: "Walk-in closet" },
        ],
      },
      {
        id: "wardrobes_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "replace_existing", label: "Replace existing" },
          { value: "modify", label: "Modify existing" },
        ],
      },
      {
        id: "wardrobes_03_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "single", label: "Single wardrobe" },
          { value: "double", label: "Double wardrobe" },
          { value: "full_wall", label: "Full wall" },
        ],
      },
      {
        id: "wardrobes_04_finish",
        label: "Finish",
        type: "radio",
        required: true,
        options: [
          { value: "painted", label: "Painted" },
          { value: "natural_wood", label: "Natural wood" },
          { value: "laminate", label: "Laminate" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "wardrobes_05_timeline",
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
    microSlug: "kitchen-cabinets",
    title: "Kitchen Cabinets",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "kitchen_cabinets_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "full_kitchen", label: "Full kitchen" },
          { value: "base_units", label: "Base units only" },
          { value: "wall_units", label: "Wall units only" },
          { value: "replace_doors", label: "Replace doors only" },
        ],
      },
      {
        id: "kitchen_cabinets_02_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "solid_wood", label: "Solid wood" },
          { value: "mdf_painted", label: "MDF (painted)" },
          { value: "shaker_style", label: "Shaker style" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "kitchen_cabinets_03_size",
        label: "Kitchen size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (< 10 units)" },
          { value: "medium", label: "Medium (10–20 units)" },
          { value: "large", label: "Large (20+ units)" },
        ],
      },
      {
        id: "kitchen_cabinets_04_worktop",
        label: "Include worktop",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "kitchen_cabinets_05_timeline",
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
        id: "kitchen_cabinets_06_photos",
        label: "Upload photos / plans",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  {
    microSlug: "bed-frames",
    title: "Bed Frames",
    metadata: { category_contract: "carpentry", inspection_bias: "low" },
    questions: [
      {
        id: "bed_frames_01_size",
        label: "Bed size",
        type: "radio",
        required: true,
        options: [
          { value: "single", label: "Single" },
          { value: "double", label: "Double" },
          { value: "king", label: "King" },
          { value: "super_king", label: "Super King" },
        ],
      },
      {
        id: "bed_frames_02_style",
        label: "Style",
        type: "radio",
        required: true,
        options: [
          { value: "platform", label: "Platform bed" },
          { value: "storage", label: "Storage bed" },
          { value: "four_poster", label: "Four poster" },
          { value: "headboard_only", label: "Headboard only" },
        ],
      },
      {
        id: "bed_frames_03_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "hardwood", label: "Hardwood" },
          { value: "softwood", label: "Softwood" },
          { value: "reclaimed", label: "Reclaimed wood" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "bed_frames_04_timeline",
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

  // ─────────────────────────────────────────────────────────────────────────
  // DOORS & WINDOWS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "interior-doors",
    title: "Interior Doors",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "interior_doors_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "supply_fit", label: "Supply & fit" },
          { value: "fit_only", label: "Fit only (I have doors)" },
          { value: "repair", label: "Repair existing" },
        ],
      },
      {
        id: "interior_doors_02_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_2", label: "1–2 doors" },
          { value: "3_5", label: "3–5 doors" },
          { value: "6_plus", label: "6+ doors" },
        ],
      },
      {
        id: "interior_doors_03_type",
        label: "Door type",
        type: "radio",
        required: true,
        options: [
          { value: "panel", label: "Panel doors" },
          { value: "flush", label: "Flush doors" },
          { value: "glazed", label: "Glazed doors" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "interior_doors_04_frame",
        label: "Frame work needed",
        type: "radio",
        required: true,
        options: [
          { value: "no", label: "No (existing frames)" },
          { value: "yes", label: "Yes (new frames)" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "interior_doors_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "exterior-doors",
    title: "Exterior Doors",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "exterior_doors_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "supply_fit", label: "Supply & fit" },
          { value: "fit_only", label: "Fit only" },
          { value: "repair", label: "Repair existing" },
        ],
      },
      {
        id: "exterior_doors_02_type",
        label: "Door type",
        type: "radio",
        required: true,
        options: [
          { value: "front_door", label: "Front door" },
          { value: "back_door", label: "Back door" },
          { value: "patio_doors", label: "Patio doors" },
          { value: "french_doors", label: "French doors" },
        ],
      },
      {
        id: "exterior_doors_03_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "solid_wood", label: "Solid wood" },
          { value: "composite", label: "Composite" },
          { value: "wood_glass", label: "Wood & glass" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "exterior_doors_04_security",
        label: "Security features",
        type: "radio",
        required: true,
        options: [
          { value: "standard", label: "Standard locks" },
          { value: "multipoint", label: "Multipoint locking" },
          { value: "smart_lock", label: "Smart lock" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "exterior_doors_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "exterior_doors_06_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: ["image/*"],
      },
    ],
  },

  {
    microSlug: "window-frames",
    title: "Window Frames",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "window_frames_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_frames", label: "New frames" },
          { value: "repair", label: "Repair existing" },
          { value: "restore", label: "Restore period frames" },
        ],
      },
      {
        id: "window_frames_02_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_3", label: "1–3 windows" },
          { value: "4_8", label: "4–8 windows" },
          { value: "9_plus", label: "9+ windows" },
        ],
      },
      {
        id: "window_frames_03_type",
        label: "Window type",
        type: "radio",
        required: true,
        options: [
          { value: "casement", label: "Casement" },
          { value: "sash", label: "Sash" },
          { value: "fixed", label: "Fixed" },
          { value: "mixed", label: "Mixed types" },
        ],
      },
      {
        id: "window_frames_04_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "hardwood", label: "Hardwood" },
          { value: "softwood", label: "Softwood" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "window_frames_05_timeline",
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
    microSlug: "shutters",
    title: "Shutters",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "shutters_01_type",
        label: "Shutter type",
        type: "radio",
        required: true,
        options: [
          { value: "interior", label: "Interior shutters" },
          { value: "exterior", label: "Exterior shutters" },
          { value: "plantation", label: "Plantation shutters" },
        ],
      },
      {
        id: "shutters_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "supply_fit", label: "Supply & fit" },
          { value: "fit_only", label: "Fit only" },
          { value: "repair", label: "Repair existing" },
        ],
      },
      {
        id: "shutters_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_3", label: "1–3 windows" },
          { value: "4_8", label: "4–8 windows" },
          { value: "9_plus", label: "9+ windows" },
        ],
      },
      {
        id: "shutters_04_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "solid_wood", label: "Solid wood" },
          { value: "composite", label: "Composite" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "shutters_05_timeline",
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

  // ─────────────────────────────────────────────────────────────────────────
  // STRUCTURAL CARPENTRY
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "roof-framing",
    title: "Roof Framing",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "roof_framing_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "extension", label: "Extension" },
          { value: "repair", label: "Repair existing" },
          { value: "replace", label: "Full replacement" },
        ],
      },
      {
        id: "roof_framing_02_type",
        label: "Roof type",
        type: "radio",
        required: true,
        options: [
          { value: "pitched", label: "Pitched roof" },
          { value: "flat", label: "Flat roof" },
          { value: "hip", label: "Hip roof" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "roof_framing_03_size",
        label: "Approximate size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (< 30m²)" },
          { value: "medium", label: "Medium (30–80m²)" },
          { value: "large", label: "Large (80m²+)" },
        ],
      },
      {
        id: "roof_framing_04_access",
        label: "Site access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "limited", label: "Limited access" },
          { value: "scaffolding_needed", label: "Scaffolding needed" },
        ],
      },
      {
        id: "roof_framing_05_timeline",
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
        id: "roof_framing_06_photos",
        label: "Upload photos / plans",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  {
    microSlug: "floor-joists",
    title: "Floor Joists",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "floor_joists_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_installation", label: "New installation" },
          { value: "repair", label: "Repair existing" },
          { value: "replace", label: "Full replacement" },
          { value: "reinforce", label: "Reinforce existing" },
        ],
      },
      {
        id: "floor_joists_02_area",
        label: "Area",
        type: "radio",
        required: true,
        options: [
          { value: "single_room", label: "Single room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
          { value: "whole_floor", label: "Whole floor" },
        ],
      },
      {
        id: "floor_joists_03_reason",
        label: "Reason for work",
        type: "radio",
        required: true,
        options: [
          { value: "rot_damage", label: "Rot / damage" },
          { value: "bounce_squeak", label: "Bounce / squeak" },
          { value: "new_build", label: "New build / extension" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "floor_joists_04_access",
        label: "Underfloor access",
        type: "radio",
        required: true,
        options: [
          { value: "crawl_space", label: "Crawl space" },
          { value: "basement", label: "Basement" },
          { value: "no_access", label: "No access" },
        ],
      },
      {
        id: "floor_joists_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "wall-framing",
    title: "Wall Framing",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "wall_framing_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_partition", label: "New partition wall" },
          { value: "remove_wall", label: "Remove wall" },
          { value: "modify", label: "Modify existing" },
        ],
      },
      {
        id: "wall_framing_02_quantity",
        label: "Number of walls",
        type: "radio",
        required: true,
        options: [
          { value: "1", label: "1 wall" },
          { value: "2_3", label: "2–3 walls" },
          { value: "4_plus", label: "4+ walls" },
        ],
      },
      {
        id: "wall_framing_03_finish",
        label: "Finish required",
        type: "radio",
        required: true,
        options: [
          { value: "frame_only", label: "Frame only" },
          { value: "frame_plaster", label: "Frame + plasterboard" },
          { value: "full_finish", label: "Full finish (skim ready)" },
        ],
      },
      {
        id: "wall_framing_04_doors",
        label: "Door openings needed",
        type: "radio",
        required: true,
        options: [
          { value: "none", label: "None" },
          { value: "1_2", label: "1–2 doors" },
          { value: "3_plus", label: "3+ doors" },
        ],
      },
      {
        id: "wall_framing_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "beam-installation",
    title: "Beam Installation",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "beam_installation_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_beam", label: "New beam installation" },
          { value: "replace", label: "Replace existing" },
          { value: "decorative", label: "Decorative beam" },
        ],
      },
      {
        id: "beam_installation_02_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "structural", label: "Structural support" },
          { value: "wall_removal", label: "Wall removal support" },
          { value: "decorative", label: "Decorative only" },
        ],
      },
      {
        id: "beam_installation_03_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "oak", label: "Oak" },
          { value: "steel_clad", label: "Steel (wood clad)" },
          { value: "reclaimed", label: "Reclaimed timber" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "beam_installation_04_length",
        label: "Approximate span",
        type: "radio",
        required: true,
        options: [
          { value: "under_3m", label: "Under 3m" },
          { value: "3_5m", label: "3–5m" },
          { value: "over_5m", label: "Over 5m" },
        ],
      },
      {
        id: "beam_installation_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "beam_installation_06_photos",
        label: "Upload photos / plans",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DECKING & PERGOLAS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "wooden-decking",
    title: "Wooden Decking",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "wooden_decking_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "extend", label: "Extend existing" },
          { value: "replace", label: "Replace existing" },
          { value: "repair", label: "Repair" },
        ],
      },
      {
        id: "wooden_decking_02_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (< 15m²)" },
          { value: "medium", label: "Medium (15–30m²)" },
          { value: "large", label: "Large (30m²+)" },
        ],
      },
      {
        id: "wooden_decking_03_wood",
        label: "Wood type",
        type: "radio",
        required: true,
        options: [
          { value: "softwood_treated", label: "Softwood (treated)" },
          { value: "hardwood", label: "Hardwood" },
          { value: "cedar", label: "Cedar" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "wooden_decking_04_features",
        label: "Additional features",
        type: "checkbox",
        required: false,
        options: [
          { value: "steps", label: "Steps" },
          { value: "railings", label: "Railings" },
          { value: "lighting", label: "Lighting" },
          { value: "none", label: "None" },
        ],
      },
      {
        id: "wooden_decking_05_timeline",
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
    microSlug: "composite-decking",
    title: "Composite Decking",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "composite_decking_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "replace_wood", label: "Replace wooden decking" },
          { value: "extend", label: "Extend existing" },
        ],
      },
      {
        id: "composite_decking_02_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (< 15m²)" },
          { value: "medium", label: "Medium (15–30m²)" },
          { value: "large", label: "Large (30m²+)" },
        ],
      },
      {
        id: "composite_decking_03_finish",
        label: "Finish preference",
        type: "radio",
        required: true,
        options: [
          { value: "wood_grain", label: "Wood grain effect" },
          { value: "smooth", label: "Smooth" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "composite_decking_04_features",
        label: "Additional features",
        type: "checkbox",
        required: false,
        options: [
          { value: "steps", label: "Steps" },
          { value: "railings", label: "Railings" },
          { value: "lighting", label: "Lighting" },
          { value: "none", label: "None" },
        ],
      },
      {
        id: "composite_decking_05_timeline",
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
    microSlug: "pergola-construction",
    title: "Pergola Construction",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "pergola_01_type",
        label: "Pergola type",
        type: "radio",
        required: true,
        options: [
          { value: "freestanding", label: "Freestanding" },
          { value: "attached", label: "Attached to building" },
        ],
      },
      {
        id: "pergola_02_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (< 10m²)" },
          { value: "medium", label: "Medium (10–20m²)" },
          { value: "large", label: "Large (20m²+)" },
        ],
      },
      {
        id: "pergola_03_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "softwood", label: "Softwood (treated)" },
          { value: "hardwood", label: "Hardwood" },
          { value: "oak", label: "Oak" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "pergola_04_roof",
        label: "Roof covering",
        type: "radio",
        required: true,
        options: [
          { value: "open_slats", label: "Open slats" },
          { value: "canvas", label: "Canvas / fabric" },
          { value: "polycarbonate", label: "Polycarbonate" },
          { value: "none", label: "None" },
        ],
      },
      {
        id: "pergola_05_timeline",
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
    microSlug: "gazebos",
    title: "Gazebos",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "gazebos_01_type",
        label: "Type",
        type: "radio",
        required: true,
        options: [
          { value: "open", label: "Open gazebo" },
          { value: "enclosed", label: "Enclosed / screened" },
          { value: "hot_tub", label: "Hot tub enclosure" },
        ],
      },
      {
        id: "gazebos_02_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (< 10m²)" },
          { value: "medium", label: "Medium (10–15m²)" },
          { value: "large", label: "Large (15m²+)" },
        ],
      },
      {
        id: "gazebos_03_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "softwood", label: "Softwood" },
          { value: "hardwood", label: "Hardwood" },
          { value: "cedar", label: "Cedar" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "gazebos_04_roof",
        label: "Roof type",
        type: "radio",
        required: true,
        options: [
          { value: "shingle", label: "Shingle" },
          { value: "tiles", label: "Tiles" },
          { value: "thatch", label: "Thatch" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "gazebos_05_timeline",
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

  // ─────────────────────────────────────────────────────────────────────────
  // RESTORATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "antique-restoration",
    title: "Antique Restoration",
    metadata: { category_contract: "carpentry", inspection_bias: "high" },
    questions: [
      {
        id: "antique_restoration_01_item",
        label: "Item type",
        type: "radio",
        required: true,
        options: [
          { value: "furniture", label: "Furniture" },
          { value: "doors", label: "Doors" },
          { value: "paneling", label: "Wall paneling" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "antique_restoration_02_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "single", label: "Single item" },
          { value: "2_3", label: "2–3 items" },
          { value: "4_plus", label: "4+ items" },
        ],
      },
      {
        id: "antique_restoration_03_condition",
        label: "Current condition",
        type: "radio",
        required: true,
        options: [
          { value: "good", label: "Good (minor repairs)" },
          { value: "fair", label: "Fair (moderate damage)" },
          { value: "poor", label: "Poor (significant damage)" },
        ],
      },
      {
        id: "antique_restoration_04_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "structural_repair", label: "Structural repair" },
          { value: "refinish", label: "Refinishing" },
          { value: "veneer", label: "Veneer repair" },
          { value: "upholstery", label: "Upholstery" },
        ],
      },
      {
        id: "antique_restoration_05_timeline",
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
        id: "antique_restoration_06_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: ["image/*"],
      },
    ],
  },

  {
    microSlug: "wood-repair",
    title: "Wood Repair",
    metadata: { category_contract: "carpentry", inspection_bias: "medium" },
    questions: [
      {
        id: "wood_repair_01_item",
        label: "What needs repair",
        type: "radio",
        required: true,
        options: [
          { value: "doors", label: "Doors" },
          { value: "windows", label: "Window frames" },
          { value: "furniture", label: "Furniture" },
          { value: "flooring", label: "Flooring" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "wood_repair_02_damage",
        label: "Type of damage",
        type: "radio",
        required: true,
        options: [
          { value: "rot", label: "Rot" },
          { value: "cracks", label: "Cracks / splits" },
          { value: "water_damage", label: "Water damage" },
          { value: "general_wear", label: "General wear" },
        ],
      },
      {
        id: "wood_repair_03_extent",
        label: "Extent",
        type: "radio",
        required: true,
        options: [
          { value: "minor", label: "Minor (localized)" },
          { value: "moderate", label: "Moderate" },
          { value: "extensive", label: "Extensive" },
        ],
      },
      {
        id: "wood_repair_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "wood_repair_05_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: ["image/*"],
      },
    ],
  },

  {
    microSlug: "refinishing",
    title: "Refinishing",
    metadata: { category_contract: "carpentry", inspection_bias: "low" },
    questions: [
      {
        id: "refinishing_01_item",
        label: "What needs refinishing",
        type: "radio",
        required: true,
        options: [
          { value: "furniture", label: "Furniture" },
          { value: "cabinets", label: "Cabinets" },
          { value: "doors", label: "Doors" },
          { value: "flooring", label: "Flooring" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "refinishing_02_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "single", label: "Single item" },
          { value: "2_5", label: "2–5 items" },
          { value: "6_plus", label: "6+ items" },
        ],
      },
      {
        id: "refinishing_03_finish",
        label: "Desired finish",
        type: "radio",
        required: true,
        options: [
          { value: "natural", label: "Natural / clear" },
          { value: "stain", label: "Stained" },
          { value: "painted", label: "Painted" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "refinishing_04_strip",
        label: "Stripping needed",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes (existing finish)" },
          { value: "no", label: "No (raw wood)" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "refinishing_05_timeline",
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
];
