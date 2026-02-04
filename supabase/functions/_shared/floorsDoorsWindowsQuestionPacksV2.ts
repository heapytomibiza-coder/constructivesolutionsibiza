/**
 * Floors, Doors & Windows Question Packs V2
 * 13 micro-services covering doors, flooring, glazing, and windows
 */

export const floorsDoorsWindowsQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // DOOR INSTALLATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "door-fitting",
    title: "Door Fitting",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "door_fitting_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "door_fitting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "fit_new", label: "Fit new door" },
          { value: "refit_existing", label: "Refit existing door" },
        ],
      },
      {
        id: "door_fitting_03_door_type",
        label: "Door type",
        type: "radio",
        required: true,
        options: [
          { value: "internal", label: "Internal door" },
          { value: "external", label: "External door" },
        ],
      },
      {
        id: "door_fitting_04_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_door", label: "1 door" },
          { value: "2_5_doors", label: "2–5 doors" },
          { value: "6_plus_doors", label: "6+ doors" },
        ],
      },
      {
        id: "door_fitting_05_supplied",
        label: "Door supplied",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "door_fitting_06_timeline",
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
    microSlug: "door-hardware",
    title: "Door Hardware",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "low" },
    questions: [
      {
        id: "door_hardware_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "door_hardware_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "handles", label: "Handles" },
          { value: "hinges", label: "Hinges" },
          { value: "locks", label: "Locks" },
          { value: "multiple_items", label: "Multiple items" },
        ],
      },
      {
        id: "door_hardware_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_items", label: "1–2 items" },
          { value: "3_5_items", label: "3–5 items" },
          { value: "more_than_5", label: "More than 5" },
        ],
      },
      {
        id: "door_hardware_04_timeline",
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
    microSlug: "door-replacement",
    title: "Door Replacement",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "door_replacement_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "door_replacement_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "internal", label: "Internal doors" },
          { value: "external", label: "External doors" },
        ],
      },
      {
        id: "door_replacement_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_door", label: "1 door" },
          { value: "2_5_doors", label: "2–5 doors" },
          { value: "6_plus_doors", label: "6+ doors" },
        ],
      },
      {
        id: "door_replacement_04_supplied",
        label: "Door supplied",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "door_replacement_05_timeline",
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
  // FLOORING INSTALLATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "floor-sanding",
    title: "Floor Sanding",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "floor_sanding_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "floor_sanding_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "light_sanding", label: "Light sanding" },
          { value: "full_sanding_refinish", label: "Full sanding & refinish" },
        ],
      },
      {
        id: "floor_sanding_03_size",
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
        id: "floor_sanding_04_finish",
        label: "Finish",
        type: "radio",
        required: true,
        options: [
          { value: "natural", label: "Natural" },
          { value: "stained", label: "Stained" },
          { value: "lacquered", label: "Lacquered" },
        ],
      },
      {
        id: "floor_sanding_05_timeline",
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
    microSlug: "hardwood-flooring",
    title: "Hardwood Flooring",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "hardwood_flooring_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "hardwood_flooring_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_installation", label: "New installation" },
          { value: "replace_existing", label: "Replace existing flooring" },
        ],
      },
      {
        id: "hardwood_flooring_03_size",
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
        id: "hardwood_flooring_04_supply",
        label: "Supply",
        type: "radio",
        required: true,
        options: [
          { value: "client_supplied", label: "Client supplied" },
          { value: "installer_supplied", label: "Installer supplied" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "hardwood_flooring_05_timeline",
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
    microSlug: "laminate-flooring",
    title: "Laminate Flooring",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "low" },
    questions: [
      {
        id: "laminate_flooring_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "laminate_flooring_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_installation", label: "New installation" },
          { value: "replace_existing", label: "Replace existing flooring" },
        ],
      },
      {
        id: "laminate_flooring_03_size",
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
        id: "laminate_flooring_04_timeline",
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
    microSlug: "tile-flooring",
    title: "Tile Flooring",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "tile_flooring_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "tile_flooring_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "floor_tiling", label: "Floor tiling" },
          { value: "wall_tiling", label: "Wall tiling" },
          { value: "both", label: "Both" },
        ],
      },
      {
        id: "tile_flooring_03_size",
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
        id: "tile_flooring_04_supplied",
        label: "Tile supplied",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "tile_flooring_05_timeline",
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
  // GLAZING
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "glass-repair",
    title: "Glass Repair",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "low" },
    questions: [
      {
        id: "glass_repair_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "glass_repair_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "cracked_glass", label: "Cracked glass" },
          { value: "broken_glass", label: "Broken glass" },
        ],
      },
      {
        id: "glass_repair_03_glass_type",
        label: "Glass type",
        type: "radio",
        required: true,
        options: [
          { value: "window", label: "Window" },
          { value: "door", label: "Door" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "glass_repair_04_timeline",
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
    microSlug: "glass-replacement",
    title: "Glass Replacement",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "glass_replacement_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "glass_replacement_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_pane", label: "Single pane" },
          { value: "double_glazing_unit", label: "Double glazing unit" },
        ],
      },
      {
        id: "glass_replacement_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_unit", label: "1 unit" },
          { value: "multiple_units", label: "Multiple units" },
        ],
      },
      {
        id: "glass_replacement_04_timeline",
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
    microSlug: "mirror-installation",
    title: "Mirror Installation",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "low" },
    questions: [
      {
        id: "mirror_installation_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "mirror_installation_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "wall_mounted", label: "Wall-mounted mirror" },
          { value: "bathroom_mirror", label: "Bathroom mirror" },
        ],
      },
      {
        id: "mirror_installation_03_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "mirror_installation_04_timeline",
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
  // WINDOW INSTALLATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "double-glazing",
    title: "Double Glazing",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "double_glazing_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "double_glazing_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "replace_existing", label: "Replace existing" },
          { value: "new_installation", label: "New installation" },
        ],
      },
      {
        id: "double_glazing_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_windows", label: "1–2 windows" },
          { value: "3_5_windows", label: "3–5 windows" },
          { value: "6_plus_windows", label: "6+ windows" },
        ],
      },
      {
        id: "double_glazing_04_timeline",
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
    microSlug: "window-fitting",
    title: "Window Fitting",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "window_fitting_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "window_fitting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "fit_new", label: "Fit new windows" },
          { value: "refit_existing", label: "Refit existing windows" },
        ],
      },
      {
        id: "window_fitting_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_windows", label: "1–2 windows" },
          { value: "3_5_windows", label: "3–5 windows" },
          { value: "6_plus_windows", label: "6+ windows" },
        ],
      },
      {
        id: "window_fitting_04_timeline",
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
    microSlug: "window-replacement",
    title: "Window Replacement",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "window_replacement_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "window_replacement_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "replace_existing", label: "Replace existing windows" },
        ],
      },
      {
        id: "window_replacement_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_windows", label: "1–2 windows" },
          { value: "3_5_windows", label: "3–5 windows" },
          { value: "6_plus_windows", label: "6+ windows" },
        ],
      },
      {
        id: "window_replacement_04_timeline",
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
  // ADDITIONAL GLAZING & WINDOWS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "double-glazing",
    title: "Double Glazing",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "double_glazing_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "double_glazing_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_windows", label: "New double glazed windows" },
          { value: "upgrade_existing", label: "Upgrade existing to double glazing" },
          { value: "repair_seal", label: "Repair / reseal existing" },
        ],
      },
      {
        id: "double_glazing_03_quantity",
        label: "Number of windows",
        type: "radio",
        required: true,
        options: [
          { value: "1_3_windows", label: "1–3 windows" },
          { value: "4_8_windows", label: "4–8 windows" },
          { value: "full_property", label: "Full property" },
        ],
      },
      {
        id: "double_glazing_04_frame",
        label: "Frame type",
        type: "radio",
        required: true,
        options: [
          { value: "upvc", label: "uPVC" },
          { value: "aluminium", label: "Aluminium" },
          { value: "wood", label: "Wood" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "double_glazing_05_timeline",
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
    microSlug: "mirror-installation",
    title: "Mirror Installation",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "low" },
    questions: [
      {
        id: "mirror_installation_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "mirror_installation_02_type",
        label: "Mirror type",
        type: "radio",
        required: true,
        options: [
          { value: "bathroom", label: "Bathroom mirror" },
          { value: "wardrobe", label: "Wardrobe / full length" },
          { value: "decorative", label: "Decorative mirror" },
          { value: "gym", label: "Gym / studio mirror" },
        ],
      },
      {
        id: "mirror_installation_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_mirror", label: "1 mirror" },
          { value: "2_3_mirrors", label: "2–3 mirrors" },
          { value: "4_plus", label: "4+ mirrors" },
        ],
      },
      {
        id: "mirror_installation_04_supply",
        label: "Mirror supply",
        type: "radio",
        required: true,
        options: [
          { value: "client_supplied", label: "Already have mirror(s)" },
          { value: "need_supply", label: "Need supply & install" },
        ],
      },
      {
        id: "mirror_installation_05_timeline",
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
    microSlug: "window-fitting",
    title: "Window Fitting",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "window_fitting_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "window_fitting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "fit_new", label: "Fit new windows" },
          { value: "refit_existing", label: "Refit existing windows" },
          { value: "new_opening", label: "Create new window opening" },
        ],
      },
      {
        id: "window_fitting_03_quantity",
        label: "Number of windows",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_windows", label: "1–2 windows" },
          { value: "3_6_windows", label: "3–6 windows" },
          { value: "7_plus", label: "7+ windows" },
        ],
      },
      {
        id: "window_fitting_04_type",
        label: "Window type",
        type: "radio",
        required: true,
        options: [
          { value: "casement", label: "Casement" },
          { value: "sliding", label: "Sliding" },
          { value: "fixed", label: "Fixed" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "window_fitting_05_supplied",
        label: "Windows supplied",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes, already purchased" },
          { value: "no", label: "No, need supply & fit" },
        ],
      },
      {
        id: "window_fitting_06_timeline",
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
    microSlug: "window-replacement",
    title: "Window Replacement",
    metadata: { category_contract: "floors-doors-windows", inspection_bias: "medium" },
    questions: [
      {
        id: "window_replacement_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "window_replacement_02_reason",
        label: "Reason for replacement",
        type: "radio",
        required: true,
        options: [
          { value: "damaged", label: "Damaged / broken" },
          { value: "upgrade", label: "Upgrade (energy efficiency)" },
          { value: "aesthetic", label: "Aesthetic / style change" },
          { value: "security", label: "Security upgrade" },
        ],
      },
      {
        id: "window_replacement_03_quantity",
        label: "Number of windows",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_windows", label: "1–2 windows" },
          { value: "3_6_windows", label: "3–6 windows" },
          { value: "full_property", label: "Full property" },
        ],
      },
      {
        id: "window_replacement_04_frame",
        label: "New frame preference",
        type: "radio",
        required: true,
        options: [
          { value: "upvc", label: "uPVC" },
          { value: "aluminium", label: "Aluminium" },
          { value: "wood", label: "Wood" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "window_replacement_05_timeline",
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
