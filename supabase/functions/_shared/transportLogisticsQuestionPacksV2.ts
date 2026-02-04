/**
 * Transport & Logistics Question Packs V2
 * 15 micro-services covering delivery, equipment rental, moving, and waste removal
 * Note: Only 9 of these match active DB slugs; others are included for future expansion
 */

export const transportLogisticsQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // DELIVERY SERVICES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "same-day-delivery",
    title: "Same Day Delivery",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "same_day_delivery_01_type",
        label: "Delivery type",
        type: "radio",
        required: true,
        options: [
          { value: "documents_small", label: "Documents / small items" },
          { value: "furniture_large", label: "Furniture / large items" },
        ],
      },
      {
        id: "same_day_delivery_02_pickup",
        label: "Pickup location",
        type: "radio",
        required: true,
        options: [
          { value: "residential", label: "Residential" },
          { value: "commercial", label: "Commercial" },
        ],
      },
      {
        id: "same_day_delivery_03_dropoff",
        label: "Drop-off location",
        type: "radio",
        required: true,
        options: [
          { value: "residential", label: "Residential" },
          { value: "commercial", label: "Commercial" },
        ],
      },
      {
        id: "same_day_delivery_04_size",
        label: "Item size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "same_day_delivery_05_urgency",
        label: "Urgency",
        type: "radio",
        required: true,
        options: [
          { value: "same_day", label: "Same day" },
          { value: "specific_time_slot", label: "Specific time slot" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EQUIPMENT RENTAL
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "machinery-rental",
    title: "Machinery Rental",
    metadata: { category_contract: "transport", inspection_bias: "medium" },
    questions: [
      {
        id: "machinery_rental_01_type",
        label: "Equipment type",
        type: "radio",
        required: true,
        options: [
          { value: "excavator", label: "Excavator" },
          { value: "loader", label: "Loader" },
          { value: "other", label: "Other machinery" },
        ],
      },
      {
        id: "machinery_rental_02_duration",
        label: "Rental duration",
        type: "radio",
        required: true,
        options: [
          { value: "1_day", label: "1 day" },
          { value: "2_5_days", label: "2–5 days" },
          { value: "1_week_plus", label: "1 week+" },
        ],
      },
      {
        id: "machinery_rental_03_operator",
        label: "Operator required",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "machinery_rental_04_delivery",
        label: "Delivery required",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },

  {
    microSlug: "scaffolding-rental",
    title: "Scaffolding Rental",
    metadata: { category_contract: "transport", inspection_bias: "medium" },
    questions: [
      {
        id: "scaffolding_rental_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "supply_only", label: "Supply only" },
          { value: "supply_install", label: "Supply & install" },
        ],
      },
      {
        id: "scaffolding_rental_02_height",
        label: "Height",
        type: "radio",
        required: true,
        options: [
          { value: "single_storey", label: "Single storey" },
          { value: "two_storey", label: "Two storey" },
          { value: "three_storey_plus", label: "Three storey+" },
        ],
      },
      {
        id: "scaffolding_rental_03_duration",
        label: "Duration",
        type: "radio",
        required: true,
        options: [
          { value: "short_term", label: "Short term" },
          { value: "long_term", label: "Long term" },
        ],
      },
    ],
  },

  {
    microSlug: "tool-rental",
    title: "Tool Rental",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "tool_rental_01_type",
        label: "Tool type",
        type: "radio",
        required: true,
        options: [
          { value: "power_tools", label: "Power tools" },
          { value: "hand_tools", label: "Hand tools" },
          { value: "specialist", label: "Specialist tools" },
        ],
      },
      {
        id: "tool_rental_02_duration",
        label: "Rental duration",
        type: "radio",
        required: true,
        options: [
          { value: "1_day", label: "1 day" },
          { value: "2_5_days", label: "2–5 days" },
          { value: "1_week_plus", label: "1 week+" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MOVING SERVICES
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "international-moving",
    title: "International Moving",
    metadata: { category_contract: "transport", inspection_bias: "medium" },
    questions: [
      {
        id: "international_moving_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "full_household", label: "Full household move" },
          { value: "partial", label: "Partial move" },
        ],
      },
      {
        id: "international_moving_02_destination",
        label: "Destination",
        type: "radio",
        required: true,
        options: [
          { value: "eu", label: "EU" },
          { value: "non_eu", label: "Non-EU" },
        ],
      },
      {
        id: "international_moving_03_packing",
        label: "Packing required",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "international_moving_04_timeline",
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
    microSlug: "local-moving",
    title: "Local Moving",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "local_moving_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "apartment_move", label: "Apartment move" },
          { value: "house_move", label: "House move" },
        ],
      },
      {
        id: "local_moving_02_size",
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
        id: "local_moving_03_packing",
        label: "Packing required",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "local_moving_04_timeline",
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
    microSlug: "packing-services",
    title: "Packing Services",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "packing_services_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "partial_packing", label: "Partial packing" },
          { value: "full_packing", label: "Full packing" },
        ],
      },
      {
        id: "packing_services_02_size",
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
        id: "packing_services_03_timeline",
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
  // WASTE REMOVAL
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "garden-waste",
    title: "Garden Waste",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "garden_waste_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "green_waste_only", label: "Green waste only" },
          { value: "mixed_garden_waste", label: "Mixed garden waste" },
        ],
      },
      {
        id: "garden_waste_02_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "small_load", label: "Small load" },
          { value: "medium_load", label: "Medium load" },
          { value: "large_load", label: "Large load" },
        ],
      },
      {
        id: "garden_waste_03_timeline",
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
    microSlug: "rubbish-clearance",
    title: "Rubbish Clearance",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "rubbish_clearance_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "household_waste", label: "Household waste" },
          { value: "construction_waste", label: "Construction waste" },
          { value: "mixed_waste", label: "Mixed waste" },
        ],
      },
      {
        id: "rubbish_clearance_02_quantity",
        label: "Quantity",
        type: "radio",
        required: true,
        options: [
          { value: "small_load", label: "Small load" },
          { value: "medium_load", label: "Medium load" },
          { value: "large_load", label: "Large load" },
        ],
      },
      {
        id: "rubbish_clearance_03_timeline",
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
  // ADDITIONAL LOGISTICS (for future expansion)
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "material-delivery",
    title: "Material Transport",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "material_transport_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "construction_materials", label: "Construction materials" },
          { value: "furniture", label: "Furniture" },
        ],
      },
      {
        id: "material_transport_02_size",
        label: "Load size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    ],
  },

  {
    microSlug: "site-deliveries",
    title: "Site Deliveries",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "site_deliveries_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "one_off", label: "One-off delivery" },
          { value: "multiple", label: "Multiple deliveries" },
        ],
      },
      {
        id: "site_deliveries_02_access",
        label: "Vehicle access",
        type: "radio",
        required: true,
        options: [
          { value: "easy", label: "Easy access" },
          { value: "restricted", label: "Restricted access" },
        ],
      },
    ],
  },

  {
    microSlug: "crane-hire",
    title: "Crane Hire",
    metadata: { category_contract: "transport", inspection_bias: "high" },
    questions: [
      {
        id: "crane_hire_01_lift_type",
        label: "Lift type",
        type: "radio",
        required: true,
        options: [
          { value: "materials", label: "Materials" },
          { value: "equipment", label: "Equipment" },
        ],
      },
      {
        id: "crane_hire_02_duration",
        label: "Duration",
        type: "radio",
        required: true,
        options: [
          { value: "half_day", label: "Half day" },
          { value: "full_day", label: "Full day" },
          { value: "multiple_days", label: "Multiple days" },
        ],
      },
    ],
  },

  {
    microSlug: "forklift-hire",
    title: "Forklift Hire",
    metadata: { category_contract: "transport", inspection_bias: "medium" },
    questions: [
      {
        id: "forklift_hire_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "with_operator", label: "With operator" },
          { value: "without_operator", label: "Without operator" },
        ],
      },
      {
        id: "forklift_hire_02_duration",
        label: "Duration",
        type: "radio",
        required: true,
        options: [
          { value: "1_day", label: "1 day" },
          { value: "2_5_days", label: "2–5 days" },
        ],
      },
    ],
  },

  {
    microSlug: "container-hire",
    title: "Container Hire",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "container_hire_01_size",
        label: "Container size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        id: "container_hire_02_duration",
        label: "Duration",
        type: "radio",
        required: true,
        options: [
          { value: "short_term", label: "Short term" },
          { value: "long_term", label: "Long term" },
        ],
      },
    ],
  },

  {
    microSlug: "storage-services",
    title: "Storage Services",
    metadata: { category_contract: "transport", inspection_bias: "low" },
    questions: [
      {
        id: "storage_services_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "short_term", label: "Short-term storage" },
          { value: "long_term", label: "Long-term storage" },
        ],
      },
      {
        id: "storage_services_02_item_type",
        label: "Item type",
        type: "radio",
        required: true,
        options: [
          { value: "furniture", label: "Furniture" },
          { value: "materials", label: "Materials" },
        ],
      },
    ],
  },
];
