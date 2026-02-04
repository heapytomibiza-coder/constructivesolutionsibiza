/**
 * Cleaning Question Packs V2
 * 12 micro-services covering commercial, deep cleaning, post-construction, and residential
 */

export const cleaningQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // COMMERCIAL CLEANING
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "office-cleaning",
    title: "Office Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "office_cleaning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "office", label: "Office" },
          { value: "coworking", label: "Co-working space" },
        ],
      },
      {
        id: "office_cleaning_02_scope",
        label: "Scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "general_cleaning", label: "General cleaning" },
          { value: "desks_workstations", label: "Desks & workstations" },
          { value: "toilets_kitchen", label: "Toilets & kitchen" },
          { value: "full_office_clean", label: "Full office clean" },
        ],
      },
      {
        id: "office_cleaning_03_size",
        label: "Office size",
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
        id: "office_cleaning_04_frequency",
        label: "Frequency",
        type: "radio",
        required: true,
        options: [
          { value: "one_off", label: "One-off" },
          { value: "weekly", label: "Weekly" },
          { value: "multiple_per_week", label: "Multiple times per week" },
        ],
      },
      {
        id: "office_cleaning_05_access",
        label: "Access",
        type: "radio",
        required: true,
        options: [
          { value: "during_hours", label: "During working hours" },
          { value: "after_hours", label: "After hours" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "office_cleaning_06_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "ongoing", label: "Ongoing" },
        ],
      },
    ],
  },

  {
    microSlug: "restaurant-cleaning",
    title: "Restaurant Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "medium" },
    questions: [
      {
        id: "restaurant_cleaning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "restaurant", label: "Restaurant" },
          { value: "cafe", label: "Café" },
          { value: "bar", label: "Bar" },
        ],
      },
      {
        id: "restaurant_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "front_of_house", label: "Front of house" },
          { value: "kitchen_deep_clean", label: "Kitchen deep clean" },
          { value: "full_restaurant", label: "Full restaurant clean" },
        ],
      },
      {
        id: "restaurant_cleaning_03_size",
        label: "Size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small venue" },
          { value: "medium", label: "Medium venue" },
          { value: "large", label: "Large venue" },
        ],
      },
      {
        id: "restaurant_cleaning_04_frequency",
        label: "Frequency",
        type: "radio",
        required: true,
        options: [
          { value: "one_off", label: "One-off" },
          { value: "regular", label: "Regular service" },
        ],
      },
      {
        id: "restaurant_cleaning_05_timeline",
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
    microSlug: "retail-cleaning",
    title: "Retail Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "retail_cleaning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "shop", label: "Shop" },
          { value: "showroom", label: "Showroom" },
          { value: "mall_unit", label: "Mall unit" },
        ],
      },
      {
        id: "retail_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "shop_floor", label: "Shop floor" },
          { value: "storage_areas", label: "Storage areas" },
          { value: "full_premises", label: "Full premises" },
        ],
      },
      {
        id: "retail_cleaning_03_size",
        label: "Store size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "retail_cleaning_04_frequency",
        label: "Frequency",
        type: "radio",
        required: true,
        options: [
          { value: "one_off", label: "One-off" },
          { value: "regular", label: "Regular service" },
        ],
      },
      {
        id: "retail_cleaning_05_timeline",
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
  // DEEP CLEANING
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "carpet-cleaning",
    title: "Carpet Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "carpet_cleaning_01_location",
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
        id: "carpet_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_room", label: "One room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "carpet_cleaning_03_size",
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
        id: "carpet_cleaning_04_carpet_type",
        label: "Carpet type",
        type: "radio",
        required: true,
        options: [
          { value: "synthetic", label: "Synthetic" },
          { value: "wool", label: "Wool" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "carpet_cleaning_05_timeline",
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
    microSlug: "oven-cleaning",
    title: "Oven Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "oven_cleaning_01_location",
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
        id: "oven_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_oven", label: "Single oven" },
          { value: "multiple_ovens", label: "Multiple ovens" },
        ],
      },
      {
        id: "oven_cleaning_03_condition",
        label: "Condition",
        type: "radio",
        required: true,
        options: [
          { value: "light_buildup", label: "Light build-up" },
          { value: "heavy_buildup", label: "Heavy build-up" },
        ],
      },
      {
        id: "oven_cleaning_04_timeline",
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
    microSlug: "upholstery-cleaning",
    title: "Upholstery Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "upholstery_cleaning_01_location",
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
        id: "upholstery_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "sofa", label: "Sofa" },
          { value: "chairs", label: "Chairs" },
          { value: "multiple_items", label: "Multiple items" },
        ],
      },
      {
        id: "upholstery_cleaning_03_fabric",
        label: "Fabric type",
        type: "radio",
        required: true,
        options: [
          { value: "fabric", label: "Fabric" },
          { value: "leather", label: "Leather" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "upholstery_cleaning_04_timeline",
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
  // POST-CONSTRUCTION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "debris-removal",
    title: "Debris Removal",
    metadata: { category_contract: "cleaning", inspection_bias: "medium" },
    questions: [
      {
        id: "debris_removal_01_location",
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
        id: "debris_removal_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "light_debris", label: "Light debris" },
          { value: "heavy_debris", label: "Heavy debris" },
        ],
      },
      {
        id: "debris_removal_03_area",
        label: "Area",
        type: "radio",
        required: true,
        options: [
          { value: "single_room", label: "Single room" },
          { value: "full_property", label: "Full property" },
        ],
      },
      {
        id: "debris_removal_04_timeline",
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
    microSlug: "dust-removal",
    title: "Dust Removal",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "dust_removal_01_location",
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
        id: "dust_removal_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_room", label: "One room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "dust_removal_03_size",
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
        id: "dust_removal_04_timeline",
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
    microSlug: "final-polish",
    title: "Final Polish",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "final_polish_01_location",
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
        id: "final_polish_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "before_handover", label: "Final clean before handover" },
          { value: "before_move_in", label: "Final clean before move-in" },
        ],
      },
      {
        id: "final_polish_03_size",
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
        id: "final_polish_04_timeline",
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
  // RESIDENTIAL CLEANING
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "move-in-out-cleaning",
    title: "Move In / Out Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "move_in_out_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
        ],
      },
      {
        id: "move_in_out_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "move_in", label: "Move-in clean" },
          { value: "move_out", label: "Move-out clean" },
        ],
      },
      {
        id: "move_in_out_03_size",
        label: "Property size",
        type: "radio",
        required: true,
        options: [
          { value: "studio_1_bed", label: "Studio / 1 bed" },
          { value: "2_3_bed", label: "2–3 bed" },
          { value: "4_plus_bed", label: "4+ bed" },
        ],
      },
      {
        id: "move_in_out_04_timeline",
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
    microSlug: "regular-cleaning",
    title: "Regular Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "regular_cleaning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
        ],
      },
      {
        id: "regular_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "bi_weekly", label: "Bi-weekly" },
          { value: "monthly", label: "Monthly" },
        ],
      },
      {
        id: "regular_cleaning_03_size",
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
        id: "regular_cleaning_04_timeline",
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
    microSlug: "spring-cleaning",
    title: "Spring Cleaning",
    metadata: { category_contract: "cleaning", inspection_bias: "low" },
    questions: [
      {
        id: "spring_cleaning_01_location",
        label: "Location",
        type: "radio",
        required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "villa_house", label: "Villa / House" },
        ],
      },
      {
        id: "spring_cleaning_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "partial_deep_clean", label: "Partial deep clean" },
          { value: "full_deep_clean", label: "Full deep clean" },
        ],
      },
      {
        id: "spring_cleaning_03_size",
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
        id: "spring_cleaning_04_timeline",
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
