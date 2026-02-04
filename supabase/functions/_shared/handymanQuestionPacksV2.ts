/**
 * Handyman & General Question Packs V2
 * 7 micro-services covering home maintenance and odd jobs
 */

export const handymanQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // HOME MAINTENANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "general-maintenance",
    title: "General Maintenance",
    metadata: { category_contract: "handyman", inspection_bias: "low" },
    questions: [
      {
        id: "general_maintenance_01_location",
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
        id: "general_maintenance_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "small_repairs", label: "Small repairs" },
          { value: "multiple_small_jobs", label: "Multiple small jobs" },
          { value: "ongoing_maintenance", label: "Ongoing maintenance" },
        ],
      },
      {
        id: "general_maintenance_03_job_count",
        label: "Job count",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_items", label: "1–2 items" },
          { value: "3_5_items", label: "3–5 items" },
          { value: "more_than_5", label: "More than 5" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "general_maintenance_04_skills",
        label: "Skills required",
        type: "radio",
        required: true,
        options: [
          { value: "basic_handyman", label: "Basic handyman" },
          { value: "mixed_trades", label: "Mixed trades" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "general_maintenance_05_access",
        label: "Access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "limited", label: "Limited access" },
          { value: "restricted_hours", label: "Restricted hours" },
        ],
      },
      {
        id: "general_maintenance_06_timeline",
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
        id: "general_maintenance_07_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },

  {
    microSlug: "gutter-cleaning",
    title: "Gutter Cleaning",
    metadata: { category_contract: "handyman", inspection_bias: "low" },
    questions: [
      {
        id: "gutter_cleaning_01_location",
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
        id: "gutter_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_property", label: "Single property" },
          { value: "multiple_sides", label: "Multiple sides of property" },
        ],
      },
      {
        id: "gutter_cleaning_03_height",
        label: "Property height",
        type: "radio",
        required: true,
        options: [
          { value: "single_storey", label: "Single storey" },
          { value: "two_storey", label: "Two storey" },
          { value: "three_storey_plus", label: "Three storey+" },
        ],
      },
      {
        id: "gutter_cleaning_04_access",
        label: "Access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "requires_ladder_scaffold", label: "Requires ladder/scaffold" },
        ],
      },
      {
        id: "gutter_cleaning_05_timeline",
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
    microSlug: "pressure-cleaning",
    title: "Pressure Cleaning",
    metadata: { category_contract: "handyman", inspection_bias: "low" },
    questions: [
      {
        id: "pressure_cleaning_01_location",
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
        id: "pressure_cleaning_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "driveway", label: "Driveway" },
          { value: "terrace", label: "Terrace" },
          { value: "walls", label: "Walls" },
          { value: "multiple_areas", label: "Multiple areas" },
        ],
      },
      {
        id: "pressure_cleaning_03_size",
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
        id: "pressure_cleaning_04_timeline",
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
  // ODD JOBS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "curtain-rails",
    title: "Curtain Rails",
    metadata: { category_contract: "handyman", inspection_bias: "low" },
    questions: [
      {
        id: "curtain_rails_01_location",
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
        id: "curtain_rails_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "install_new", label: "Install new rails" },
          { value: "replace_existing", label: "Replace existing rails" },
        ],
      },
      {
        id: "curtain_rails_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_windows", label: "1–2 windows" },
          { value: "3_5_windows", label: "3–5 windows" },
          { value: "more_than_5", label: "More than 5" },
        ],
      },
      {
        id: "curtain_rails_04_timeline",
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
    microSlug: "picture-hanging",
    title: "Picture Hanging",
    metadata: { category_contract: "handyman", inspection_bias: "low" },
    questions: [
      {
        id: "picture_hanging_01_location",
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
        id: "picture_hanging_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_item", label: "Single item" },
          { value: "multiple_items", label: "Multiple items" },
        ],
      },
      {
        id: "picture_hanging_03_wall_type",
        label: "Wall type",
        type: "radio",
        required: true,
        options: [
          { value: "plaster", label: "Plaster" },
          { value: "brick", label: "Brick" },
          { value: "concrete", label: "Concrete" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "picture_hanging_04_timeline",
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
    microSlug: "tv-mounting",
    title: "TV Mounting",
    metadata: { category_contract: "handyman", inspection_bias: "low" },
    questions: [
      {
        id: "tv_mounting_01_location",
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
        id: "tv_mounting_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "wall_mount_only", label: "Wall mount only" },
          { value: "wall_mount_cable_concealment", label: "Wall mount + cable concealment" },
        ],
      },
      {
        id: "tv_mounting_03_tv_size",
        label: "TV size",
        type: "radio",
        required: true,
        options: [
          { value: "up_to_40", label: "Up to 40\"" },
          { value: "40_65", label: "40–65\"" },
          { value: "65_plus", label: "65\"+" },
        ],
      },
      {
        id: "tv_mounting_04_wall_type",
        label: "Wall type",
        type: "radio",
        required: true,
        options: [
          { value: "plaster", label: "Plaster" },
          { value: "brick", label: "Brick" },
          { value: "concrete", label: "Concrete" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "tv_mounting_05_timeline",
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
  // QUICK FIXES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "general-project",
    title: "Minor Repairs",
    metadata: { category_contract: "handyman", inspection_bias: "low" },
    questions: [
      {
        id: "minor_repairs_01_location",
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
        id: "minor_repairs_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "door_handles", label: "Door handles" },
          { value: "hinges", label: "Hinges" },
          { value: "loose_fixtures", label: "Loose fixtures" },
          { value: "multiple_items", label: "Multiple items" },
        ],
      },
      {
        id: "minor_repairs_03_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "1_2_fixes", label: "1–2 fixes" },
          { value: "3_5_fixes", label: "3–5 fixes" },
          { value: "more_than_5", label: "More than 5" },
        ],
      },
      {
        id: "minor_repairs_04_timeline",
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
