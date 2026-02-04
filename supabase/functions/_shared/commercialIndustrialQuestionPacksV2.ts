/**
 * Commercial & Industrial Question Packs V2
 * 12 micro-services covering fit-outs, industrial construction, office renovation, and retail/hospitality
 */

export const commercialIndustrialQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // COMMERCIAL FIT-OUT
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "office-fit-out",
    title: "Office Fit-Out",
    metadata: { category_contract: "commercial", inspection_bias: "high" },
    questions: [
      {
        id: "office_fit_out_01_property",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "office", label: "Office" },
          { value: "coworking", label: "Co-working space" },
        ],
      },
      {
        id: "office_fit_out_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "full_fit_out", label: "Full fit-out" },
          { value: "partial_fit_out", label: "Partial fit-out" },
        ],
      },
      {
        id: "office_fit_out_03_size",
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
        id: "office_fit_out_04_finish",
        label: "Finish level",
        type: "radio",
        required: true,
        options: [
          { value: "standard", label: "Standard" },
          { value: "premium", label: "Premium" },
          { value: "not_sure", label: "Not sure" },
        ],
      },
      {
        id: "office_fit_out_05_timeline",
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
        id: "office_fit_out_06_access",
        label: "Access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "restricted", label: "Restricted access" },
        ],
      },
      {
        id: "office_fit_out_07_plans",
        label: "Upload plans",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  {
    microSlug: "restaurant-fit-out",
    title: "Restaurant Fit-Out",
    metadata: { category_contract: "commercial", inspection_bias: "high" },
    questions: [
      {
        id: "restaurant_fit_out_01_property",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "restaurant", label: "Restaurant" },
          { value: "cafe", label: "Café" },
          { value: "bar", label: "Bar" },
        ],
      },
      {
        id: "restaurant_fit_out_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "front_of_house", label: "Front of house" },
          { value: "kitchen", label: "Kitchen" },
          { value: "full_venue", label: "Full venue" },
        ],
      },
      {
        id: "restaurant_fit_out_03_size",
        label: "Venue size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "restaurant_fit_out_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "fixed_opening_date", label: "Fixed opening date" },
        ],
      },
      {
        id: "restaurant_fit_out_05_plans",
        label: "Upload plans",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  {
    microSlug: "retail-fit-out",
    title: "Retail Fit-Out",
    metadata: { category_contract: "commercial", inspection_bias: "high" },
    questions: [
      {
        id: "retail_fit_out_01_property",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "shop", label: "Shop" },
          { value: "showroom", label: "Showroom" },
          { value: "mall_unit", label: "Mall unit" },
        ],
      },
      {
        id: "retail_fit_out_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_fit_out", label: "New shop fit-out" },
          { value: "refurbishment", label: "Refurbishment" },
        ],
      },
      {
        id: "retail_fit_out_03_size",
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
        id: "retail_fit_out_04_timeline",
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
        id: "retail_fit_out_05_plans",
        label: "Upload plans",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INDUSTRIAL CONSTRUCTION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "factory-building",
    title: "Factory Building",
    metadata: { category_contract: "commercial", inspection_bias: "mandatory" },
    questions: [
      {
        id: "factory_building_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "extension", label: "Extension" },
        ],
      },
      {
        id: "factory_building_02_floor_area",
        label: "Floor area",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "factory_building_03_site_status",
        label: "Site status",
        type: "radio",
        required: true,
        options: [
          { value: "empty_land", label: "Empty land" },
          { value: "existing_structure", label: "Existing structure" },
        ],
      },
      {
        id: "factory_building_04_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_6_months", label: "Within 6 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "factory_building_05_plans",
        label: "Upload plans",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  {
    microSlug: "industrial-flooring",
    title: "Industrial Flooring",
    metadata: { category_contract: "commercial", inspection_bias: "medium" },
    questions: [
      {
        id: "industrial_flooring_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_flooring", label: "New flooring" },
          { value: "repair_existing", label: "Repair existing flooring" },
        ],
      },
      {
        id: "industrial_flooring_02_size",
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
        id: "industrial_flooring_03_usage",
        label: "Usage",
        type: "radio",
        required: true,
        options: [
          { value: "light_industrial", label: "Light industrial" },
          { value: "heavy_industrial", label: "Heavy industrial" },
        ],
      },
      {
        id: "industrial_flooring_04_timeline",
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
    microSlug: "warehouse-construction",
    title: "Warehouse Construction",
    metadata: { category_contract: "commercial", inspection_bias: "mandatory" },
    questions: [
      {
        id: "warehouse_construction_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_warehouse", label: "New warehouse" },
          { value: "extension", label: "Extension" },
        ],
      },
      {
        id: "warehouse_construction_02_size",
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
        id: "warehouse_construction_03_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_6_months", label: "Within 6 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "warehouse_construction_04_plans",
        label: "Upload plans",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OFFICE RENOVATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "meeting-rooms",
    title: "Meeting Rooms",
    metadata: { category_contract: "commercial", inspection_bias: "medium" },
    questions: [
      {
        id: "meeting_rooms_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_meeting_room", label: "New meeting room" },
          { value: "upgrade_existing", label: "Upgrade existing room" },
        ],
      },
      {
        id: "meeting_rooms_02_count",
        label: "Room count",
        type: "radio",
        required: true,
        options: [
          { value: "1_room", label: "1 room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
        ],
      },
      {
        id: "meeting_rooms_03_timeline",
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
    microSlug: "partition-walls",
    title: "Partition Walls",
    metadata: { category_contract: "commercial", inspection_bias: "medium" },
    questions: [
      {
        id: "partition_walls_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_partitions", label: "New partitions" },
          { value: "modify_existing", label: "Modify existing" },
        ],
      },
      {
        id: "partition_walls_02_material",
        label: "Material",
        type: "radio",
        required: true,
        options: [
          { value: "drywall", label: "Drywall" },
          { value: "glass", label: "Glass" },
          { value: "mixed", label: "Mixed" },
        ],
      },
      {
        id: "partition_walls_03_timeline",
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
    microSlug: "suspended-ceilings",
    title: "Suspended Ceilings",
    metadata: { category_contract: "commercial", inspection_bias: "medium" },
    questions: [
      {
        id: "suspended_ceilings_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_installation", label: "New installation" },
          { value: "replace_existing", label: "Replace existing" },
        ],
      },
      {
        id: "suspended_ceilings_02_size",
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
        id: "suspended_ceilings_03_timeline",
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
  // RETAIL & HOSPITALITY
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "bar-construction",
    title: "Bar Construction",
    metadata: { category_contract: "commercial", inspection_bias: "high" },
    questions: [
      {
        id: "bar_construction_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_bar_build", label: "New bar build" },
          { value: "bar_refurbishment", label: "Bar refurbishment" },
        ],
      },
      {
        id: "bar_construction_02_size",
        label: "Bar size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "bar_construction_03_timeline",
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
        id: "bar_construction_04_plans",
        label: "Upload plans",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  {
    microSlug: "hotel-renovation",
    title: "Hotel Renovation",
    metadata: { category_contract: "commercial", inspection_bias: "high" },
    questions: [
      {
        id: "hotel_renovation_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "guest_rooms", label: "Guest rooms" },
          { value: "common_areas", label: "Common areas" },
          { value: "full_property", label: "Full property" },
        ],
      },
      {
        id: "hotel_renovation_02_size",
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
        id: "hotel_renovation_03_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "planning_stage", label: "Planning stage" },
          { value: "within_3_6_months", label: "Within 3–6 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "hotel_renovation_04_plans",
        label: "Upload plans",
        type: "file",
        required: false,
        accept: "image/*,.pdf",
      },
    ],
  },

  {
    microSlug: "shop-front",
    title: "Shop Front",
    metadata: { category_contract: "commercial", inspection_bias: "medium" },
    questions: [
      {
        id: "shop_front_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "new_shop_front", label: "New shop front" },
          { value: "replace_existing", label: "Replace existing" },
        ],
      },
      {
        id: "shop_front_02_width",
        label: "Frontage width",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "shop_front_03_timeline",
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
        id: "shop_front_04_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: "image/*",
      },
    ],
  },
];
