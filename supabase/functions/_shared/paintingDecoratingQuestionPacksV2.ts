/**
 * Painting & Decorating Question Packs V2
 * 20 micro-services covering decorative finishes, exterior, interior, and wallpapering
 */

export const paintingDecoratingQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // DECORATIVE FINISHES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "faux-finishes",
    title: "Faux Finishes",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "faux_finishes_01_location",
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
        id: "faux_finishes_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "feature_wall", label: "Feature wall" },
          { value: "multiple_walls", label: "Multiple walls" },
          { value: "full_room", label: "Full room" },
        ],
      },
      {
        id: "faux_finishes_03_area",
        label: "Area size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (1 wall)" },
          { value: "medium", label: "Medium (2–3 walls)" },
          { value: "large", label: "Large (full room / multiple rooms)" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "faux_finishes_04_style",
        label: "Finish style",
        type: "radio",
        required: true,
        options: [
          { value: "stone_marble", label: "Stone / marble effect" },
          { value: "concrete", label: "Concrete effect" },
          { value: "custom_decorative", label: "Custom decorative finish" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "faux_finishes_05_surface",
        label: "Surface condition",
        type: "radio",
        required: true,
        options: [
          { value: "new_surface", label: "New surface" },
          { value: "previously_painted", label: "Previously painted" },
          { value: "needs_preparation", label: "Needs preparation" },
        ],
      },
      {
        id: "faux_finishes_06_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "faux_finishes_07_budget",
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
        id: "faux_finishes_08_photos",
        label: "Upload reference images",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "murals",
    title: "Murals",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "murals_01_location",
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
        id: "murals_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "interior", label: "Interior wall mural" },
          { value: "exterior", label: "Exterior wall mural" },
        ],
      },
      {
        id: "murals_03_size",
        label: "Wall size",
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
        id: "murals_04_design",
        label: "Design",
        type: "radio",
        required: true,
        options: [
          { value: "custom_artwork", label: "Custom artwork" },
          { value: "from_reference", label: "From reference image" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "murals_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "murals_06_photos",
        label: "Upload reference images",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "textured-walls",
    title: "Textured Walls",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "textured_walls_01_location",
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
        id: "textured_walls_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "feature_wall", label: "Feature wall" },
          { value: "multiple_walls", label: "Multiple walls" },
        ],
      },
      {
        id: "textured_walls_03_texture",
        label: "Texture type",
        type: "radio",
        required: true,
        options: [
          { value: "light", label: "Light texture" },
          { value: "heavy", label: "Heavy texture" },
          { value: "decorative_pattern", label: "Decorative pattern" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "textured_walls_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "textured_walls_05_photos",
        label: "Upload reference images",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "venetian-plaster",
    title: "Venetian Plaster",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "venetian_plaster_01_location",
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
        id: "venetian_plaster_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "feature_wall", label: "Feature wall" },
          { value: "full_room", label: "Full room" },
        ],
      },
      {
        id: "venetian_plaster_03_finish",
        label: "Finish level",
        type: "radio",
        required: true,
        options: [
          { value: "standard_polish", label: "Standard polish" },
          { value: "high_gloss", label: "High gloss" },
          { value: "custom", label: "Custom" },
        ],
      },
      {
        id: "venetian_plaster_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "venetian_plaster_05_photos",
        label: "Upload reference images",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EXTERIOR (LEGACY)
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "paint-facade",
    title: "Paint Facade",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "paint_facade_01_location",
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
        id: "paint_facade_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "full_facade", label: "Full facade" },
          { value: "partial_facade", label: "Partial facade" },
        ],
      },
      {
        id: "paint_facade_03_size",
        label: "Property size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "paint_facade_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "paint_facade_05_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "paint-fence",
    title: "Paint Fence",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "paint_fence_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "paint_fence_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "wooden", label: "Wooden fence" },
          { value: "metal", label: "Metal fence" },
        ],
      },
      {
        id: "paint_fence_03_length",
        label: "Length",
        type: "radio",
        required: true,
        options: [
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "long", label: "Long" },
        ],
      },
      {
        id: "paint_fence_04_timeline",
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
  // EXTERIOR PAINTING
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "deck-staining",
    title: "Deck Staining",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "deck_staining_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "deck_staining_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "clean_and_stain", label: "Clean & stain" },
          { value: "restain_existing", label: "Restain existing deck" },
        ],
      },
      {
        id: "deck_staining_03_size",
        label: "Deck size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "deck_staining_04_timeline",
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
    microSlug: "facade-painting",
    title: "Facade Painting",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "facade_painting_01_location",
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
        id: "facade_painting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "repaint_existing", label: "Repaint existing" },
          { value: "paint_new", label: "Paint new facade" },
        ],
      },
      {
        id: "facade_painting_03_height",
        label: "Height",
        type: "radio",
        required: true,
        options: [
          { value: "ground_level", label: "Ground level" },
          { value: "multi_storey", label: "Multi-storey" },
        ],
      },
      {
        id: "facade_painting_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "facade_painting_05_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "fence-painting",
    title: "Fence Painting",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "fence_painting_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "fence_painting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "wooden", label: "Wooden fence" },
          { value: "metal", label: "Metal fence" },
        ],
      },
      {
        id: "fence_painting_03_length",
        label: "Length",
        type: "radio",
        required: true,
        options: [
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "long", label: "Long" },
        ],
      },
      {
        id: "fence_painting_04_timeline",
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
    microSlug: "pressure-washing",
    title: "Pressure Washing",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "pressure_washing_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "pressure_washing_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "walls", label: "Walls" },
          { value: "driveways", label: "Driveways" },
          { value: "terraces", label: "Terraces" },
          { value: "multiple_areas", label: "Multiple areas" },
        ],
      },
      {
        id: "pressure_washing_03_size",
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
        id: "pressure_washing_04_timeline",
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
  // INTERIOR (LEGACY)
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "paint-ceiling",
    title: "Paint Ceiling",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "paint_ceiling_01_location",
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
        id: "paint_ceiling_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_room", label: "Single room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "paint_ceiling_03_timeline",
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
    microSlug: "paint-walls",
    title: "Paint Walls",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "paint_walls_01_location",
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
        id: "paint_walls_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_room", label: "One room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "paint_walls_03_timeline",
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
    microSlug: "paint-woodwork",
    title: "Paint Woodwork",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "paint_woodwork_01_location",
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
        id: "paint_woodwork_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "doors", label: "Doors" },
          { value: "skirting", label: "Skirting" },
          { value: "frames", label: "Frames" },
          { value: "multiple_items", label: "Multiple items" },
        ],
      },
      {
        id: "paint_woodwork_03_timeline",
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
  // INTERIOR PAINTING
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "cabinet-painting",
    title: "Cabinet Painting",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "cabinet_painting_01_location",
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
        id: "cabinet_painting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "kitchen", label: "Kitchen cabinets" },
          { value: "bathroom", label: "Bathroom cabinets" },
        ],
      },
      {
        id: "cabinet_painting_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "few_units", label: "Few units" },
          { value: "full_set", label: "Full set" },
        ],
      },
      {
        id: "cabinet_painting_04_timeline",
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
    microSlug: "ceiling-painting",
    title: "Ceiling Painting",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "ceiling_painting_01_location",
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
        id: "ceiling_painting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_room", label: "One room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "ceiling_painting_03_timeline",
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
    microSlug: "trim-woodwork",
    title: "Trim & Woodwork",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "trim_woodwork_01_location",
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
        id: "trim_woodwork_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "skirting_boards", label: "Skirting boards" },
          { value: "door_frames", label: "Door frames" },
          { value: "window_frames", label: "Window frames" },
        ],
      },
      {
        id: "trim_woodwork_03_timeline",
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
    microSlug: "wall-painting",
    title: "Wall Painting",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "wall_painting_01_location",
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
        id: "wall_painting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_room", label: "One room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "wall_painting_03_timeline",
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
  // WALLPAPERING
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "feature-walls",
    title: "Feature Walls",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "feature_walls_01_location",
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
        id: "feature_walls_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single", label: "Single feature wall" },
          { value: "multiple", label: "Multiple feature walls" },
        ],
      },
      {
        id: "feature_walls_03_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "within_1_2_weeks", label: "Within 1–2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "feature_walls_04_photos",
        label: "Upload reference images",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "wallpaper-installation",
    title: "Wallpaper Installation",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "wallpaper_install_01_location",
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
        id: "wallpaper_install_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_room", label: "One room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "wallpaper_install_03_supply",
        label: "Wallpaper supplied",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "wallpaper_install_04_timeline",
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
    microSlug: "wallpaper-removal",
    title: "Wallpaper Removal",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "wallpaper_removal_01_location",
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
        id: "wallpaper_removal_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_room", label: "One room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "wallpaper_removal_03_timeline",
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
  // ADDITIONAL SERVICES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "cabinet-painting",
    title: "Cabinet Painting",
    metadata: { category_contract: "painting", inspection_bias: "medium" },
    questions: [
      {
        id: "cabinet_painting_01_location",
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
        id: "cabinet_painting_02_type",
        label: "Cabinet type",
        type: "radio",
        required: true,
        options: [
          { value: "kitchen", label: "Kitchen cabinets" },
          { value: "bathroom", label: "Bathroom cabinets" },
          { value: "wardrobes", label: "Wardrobes" },
          { value: "other", label: "Other built-in units" },
        ],
      },
      {
        id: "cabinet_painting_03_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "doors_only", label: "Doors & drawers only" },
          { value: "full_cabinets", label: "Full cabinets (inside & out)" },
        ],
      },
      {
        id: "cabinet_painting_04_quantity",
        label: "Number of cabinets",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small kitchen (< 10 doors)" },
          { value: "medium", label: "Medium kitchen (10–20 doors)" },
          { value: "large", label: "Large kitchen (20+ doors)" },
        ],
      },
      {
        id: "cabinet_painting_05_finish",
        label: "Finish",
        type: "radio",
        required: true,
        options: [
          { value: "matt", label: "Matt" },
          { value: "satin", label: "Satin" },
          { value: "gloss", label: "Gloss" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "cabinet_painting_06_timeline",
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
    microSlug: "feature-walls",
    title: "Feature Walls",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "feature_walls_01_location",
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
        id: "feature_walls_02_type",
        label: "Feature type",
        type: "radio",
        required: true,
        options: [
          { value: "bold_color", label: "Bold / accent color" },
          { value: "pattern", label: "Pattern / geometric" },
          { value: "texture", label: "Textured finish" },
          { value: "mural", label: "Mural / artwork" },
        ],
      },
      {
        id: "feature_walls_03_room",
        label: "Room",
        type: "radio",
        required: true,
        options: [
          { value: "living_room", label: "Living room" },
          { value: "bedroom", label: "Bedroom" },
          { value: "dining", label: "Dining area" },
          { value: "office", label: "Office / workspace" },
        ],
      },
      {
        id: "feature_walls_04_size",
        label: "Wall size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "feature_walls_05_timeline",
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
    microSlug: "fence-painting",
    title: "Fence Painting",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "fence_painting_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "fence_painting_02_material",
        label: "Fence material",
        type: "radio",
        required: true,
        options: [
          { value: "wooden", label: "Wooden fence" },
          { value: "metal", label: "Metal fence" },
          { value: "mixed", label: "Mixed materials" },
        ],
      },
      {
        id: "fence_painting_03_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "paint_only", label: "Paint / stain only" },
          { value: "prep_and_paint", label: "Prep, prime & paint" },
        ],
      },
      {
        id: "fence_painting_04_length",
        label: "Fence length",
        type: "radio",
        required: true,
        options: [
          { value: "short", label: "Short (< 10m)" },
          { value: "medium", label: "Medium (10–30m)" },
          { value: "long", label: "Long (30m+)" },
        ],
      },
      {
        id: "fence_painting_05_timeline",
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
    microSlug: "pressure-washing",
    title: "Pressure Washing",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "pressure_washing_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "pressure_washing_02_area",
        label: "Area to clean",
        type: "checkbox",
        required: true,
        options: [
          { value: "driveway", label: "Driveway" },
          { value: "patio", label: "Patio / terrace" },
          { value: "walls", label: "Exterior walls" },
          { value: "pool_area", label: "Pool surround" },
          { value: "fence", label: "Fence / gates" },
        ],
      },
      {
        id: "pressure_washing_03_size",
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
        id: "pressure_washing_04_condition",
        label: "Current condition",
        type: "radio",
        required: true,
        options: [
          { value: "light_dirt", label: "Light dirt" },
          { value: "moderate", label: "Moderate build-up" },
          { value: "heavy", label: "Heavy dirt / algae" },
        ],
      },
      {
        id: "pressure_washing_05_timeline",
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
    microSlug: "trim-woodwork",
    title: "Trim & Woodwork",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "trim_woodwork_01_location",
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
        id: "trim_woodwork_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "skirting", label: "Skirting boards" },
          { value: "door_frames", label: "Door frames" },
          { value: "window_frames", label: "Window frames" },
          { value: "crown_moulding", label: "Crown moulding" },
        ],
      },
      {
        id: "trim_woodwork_03_size",
        label: "Property size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (1–2 rooms)" },
          { value: "medium", label: "Medium (3–5 rooms)" },
          { value: "large", label: "Large (6+ rooms)" },
        ],
      },
      {
        id: "trim_woodwork_04_finish",
        label: "Finish",
        type: "radio",
        required: true,
        options: [
          { value: "gloss", label: "Gloss" },
          { value: "satin", label: "Satin" },
          { value: "matt", label: "Matt" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "trim_woodwork_05_timeline",
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
    microSlug: "wall-painting",
    title: "Wall Painting",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "wall_painting_01_location",
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
        id: "wall_painting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_room", label: "Single room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
          { value: "full_property", label: "Full property" },
        ],
      },
      {
        id: "wall_painting_03_size",
        label: "Property size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "wall_painting_04_prep",
        label: "Preparation needed",
        type: "radio",
        required: true,
        options: [
          { value: "minimal", label: "Minimal (clean walls)" },
          { value: "some", label: "Some (fill holes, sand)" },
          { value: "extensive", label: "Extensive (repairs, primer)" },
        ],
      },
      {
        id: "wall_painting_05_finish",
        label: "Finish",
        type: "radio",
        required: true,
        options: [
          { value: "matt", label: "Matt" },
          { value: "eggshell", label: "Eggshell / satin" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "wall_painting_06_timeline",
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
    microSlug: "wallpaper-installation",
    title: "Wallpaper Installation",
    metadata: { category_contract: "painting", inspection_bias: "low" },
    questions: [
      {
        id: "wallpaper_installation_01_location",
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
        id: "wallpaper_installation_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "feature_wall", label: "Feature wall" },
          { value: "full_room", label: "Full room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "wallpaper_installation_03_type",
        label: "Wallpaper type",
        type: "radio",
        required: true,
        options: [
          { value: "standard", label: "Standard paper" },
          { value: "vinyl", label: "Vinyl / washable" },
          { value: "textured", label: "Textured / embossed" },
          { value: "mural", label: "Photo mural" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "wallpaper_installation_04_supply",
        label: "Wallpaper supply",
        type: "radio",
        required: true,
        options: [
          { value: "client_supplied", label: "Already have wallpaper" },
          { value: "need_supply", label: "Need help sourcing" },
        ],
      },
      {
        id: "wallpaper_installation_05_prep",
        label: "Wall condition",
        type: "radio",
        required: true,
        options: [
          { value: "ready", label: "Ready for papering" },
          { value: "needs_prep", label: "Needs preparation" },
          { value: "has_existing", label: "Has existing wallpaper" },
        ],
      },
      {
        id: "wallpaper_installation_06_timeline",
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
