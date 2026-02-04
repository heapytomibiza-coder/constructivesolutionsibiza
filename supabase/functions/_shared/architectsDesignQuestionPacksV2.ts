/**
 * Architects & Design Question Packs V2
 * 12 micro-services covering architectural design, interior design, project management, and 3D visualization
 */

export const architectsDesignQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // ARCHITECTURAL DESIGN
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "new-build-design",
    title: "New Build Design",
    metadata: { category_contract: "architects-design", inspection_bias: "high" },
    questions: [
      {
        id: "new_build_design_01_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "villa", label: "Villa" },
          { value: "townhouse", label: "Townhouse" },
          { value: "apartment_block", label: "Apartment block" },
          { value: "commercial", label: "Commercial building" },
        ],
      },
      {
        id: "new_build_design_02_size",
        label: "Approximate size",
        type: "radio",
        required: true,
        options: [
          { value: "under_150m2", label: "Under 150m²" },
          { value: "150_300m2", label: "150–300m²" },
          { value: "300_500m2", label: "300–500m²" },
          { value: "over_500m2", label: "Over 500m²" },
        ],
      },
      {
        id: "new_build_design_03_scope",
        label: "Service scope",
        type: "checkbox",
        required: true,
        options: [
          { value: "concept_design", label: "Concept design" },
          { value: "planning_drawings", label: "Planning drawings" },
          { value: "technical_drawings", label: "Technical drawings" },
          { value: "project_management", label: "Project management" },
        ],
      },
      {
        id: "new_build_design_04_planning",
        label: "Planning status",
        type: "radio",
        required: true,
        options: [
          { value: "have_land", label: "Have land / plot" },
          { value: "searching", label: "Searching for land" },
          { value: "planning_approved", label: "Planning already approved" },
        ],
      },
      {
        id: "new_build_design_05_style",
        label: "Design style",
        type: "radio",
        required: true,
        options: [
          { value: "contemporary", label: "Contemporary / modern" },
          { value: "mediterranean", label: "Mediterranean" },
          { value: "traditional", label: "Traditional" },
          { value: "eco_sustainable", label: "Eco / sustainable" },
          { value: "not_sure", label: "Not sure yet" },
        ],
      },
      {
        id: "new_build_design_06_timeline",
        label: "When do you need to start",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "within_6_months", label: "Within 6 months" },
          { value: "flexible", label: "Flexible / planning stage" },
        ],
      },
      {
        id: "new_build_design_07_files",
        label: "Upload site plans / inspiration",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  {
    microSlug: "extension-design",
    title: "Extension Design",
    metadata: { category_contract: "architects-design", inspection_bias: "high" },
    questions: [
      {
        id: "extension_design_01_type",
        label: "Extension type",
        type: "radio",
        required: true,
        options: [
          { value: "single_storey", label: "Single storey" },
          { value: "double_storey", label: "Double storey" },
          { value: "basement", label: "Basement" },
          { value: "loft_conversion", label: "Loft conversion" },
        ],
      },
      {
        id: "extension_design_02_purpose",
        label: "Primary purpose",
        type: "radio",
        required: true,
        options: [
          { value: "living_space", label: "Living space" },
          { value: "bedroom", label: "Bedroom(s)" },
          { value: "kitchen", label: "Kitchen" },
          { value: "home_office", label: "Home office" },
          { value: "garage", label: "Garage" },
        ],
      },
      {
        id: "extension_design_03_size",
        label: "Approximate size",
        type: "radio",
        required: true,
        options: [
          { value: "under_30m2", label: "Under 30m²" },
          { value: "30_60m2", label: "30–60m²" },
          { value: "60_100m2", label: "60–100m²" },
          { value: "over_100m2", label: "Over 100m²" },
        ],
      },
      {
        id: "extension_design_04_scope",
        label: "Services needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "feasibility", label: "Feasibility study" },
          { value: "planning", label: "Planning application" },
          { value: "technical", label: "Technical drawings" },
          { value: "building_regs", label: "Building regulations" },
        ],
      },
      {
        id: "extension_design_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "within_6_months", label: "Within 6 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "extension_design_06_photos",
        label: "Upload photos / plans",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  {
    microSlug: "renovation-design",
    title: "Renovation Design",
    metadata: { category_contract: "architects-design", inspection_bias: "high" },
    questions: [
      {
        id: "renovation_design_01_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "villa", label: "Villa / house" },
          { value: "apartment", label: "Apartment" },
          { value: "finca", label: "Finca / rural property" },
          { value: "commercial", label: "Commercial" },
        ],
      },
      {
        id: "renovation_design_02_scope",
        label: "Renovation scope",
        type: "radio",
        required: true,
        options: [
          { value: "full_renovation", label: "Full renovation" },
          { value: "partial", label: "Partial (specific areas)" },
          { value: "structural_changes", label: "Structural changes" },
          { value: "cosmetic", label: "Cosmetic updates" },
        ],
      },
      {
        id: "renovation_design_03_areas",
        label: "Areas to renovate",
        type: "checkbox",
        required: true,
        options: [
          { value: "kitchen", label: "Kitchen" },
          { value: "bathrooms", label: "Bathrooms" },
          { value: "living_areas", label: "Living areas" },
          { value: "bedrooms", label: "Bedrooms" },
          { value: "outdoor", label: "Outdoor spaces" },
        ],
      },
      {
        id: "renovation_design_04_services",
        label: "Services needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "concept_design", label: "Concept design" },
          { value: "technical_drawings", label: "Technical drawings" },
          { value: "permits", label: "Permit assistance" },
          { value: "project_management", label: "Project management" },
        ],
      },
      {
        id: "renovation_design_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "renovation_design_06_photos",
        label: "Upload photos",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INTERIOR DESIGN
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "space-planning",
    title: "Space Planning",
    metadata: { category_contract: "architects-design", inspection_bias: "medium" },
    questions: [
      {
        id: "space_planning_01_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "residential", label: "Residential" },
          { value: "office", label: "Office" },
          { value: "retail", label: "Retail" },
          { value: "hospitality", label: "Hospitality" },
        ],
      },
      {
        id: "space_planning_02_size",
        label: "Area size",
        type: "radio",
        required: true,
        options: [
          { value: "under_50m2", label: "Under 50m²" },
          { value: "50_150m2", label: "50–150m²" },
          { value: "150_300m2", label: "150–300m²" },
          { value: "over_300m2", label: "Over 300m²" },
        ],
      },
      {
        id: "space_planning_03_scope",
        label: "What do you need",
        type: "checkbox",
        required: true,
        options: [
          { value: "layout_options", label: "Layout options" },
          { value: "furniture_plan", label: "Furniture plan" },
          { value: "flow_optimization", label: "Flow optimization" },
          { value: "zoning", label: "Zoning / functional areas" },
        ],
      },
      {
        id: "space_planning_04_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "moving_in", label: "Moving into new space" },
          { value: "reconfigure", label: "Reconfigure existing" },
          { value: "renovation", label: "Part of renovation" },
        ],
      },
      {
        id: "space_planning_05_timeline",
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
    microSlug: "furniture-selection",
    title: "Furniture Selection",
    metadata: { category_contract: "architects-design", inspection_bias: "low" },
    questions: [
      {
        id: "furniture_selection_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "whole_property", label: "Whole property" },
          { value: "specific_rooms", label: "Specific rooms" },
          { value: "key_pieces", label: "Key pieces only" },
        ],
      },
      {
        id: "furniture_selection_02_rooms",
        label: "Rooms",
        type: "checkbox",
        required: true,
        options: [
          { value: "living_room", label: "Living room" },
          { value: "dining", label: "Dining area" },
          { value: "bedrooms", label: "Bedrooms" },
          { value: "outdoor", label: "Outdoor" },
          { value: "office", label: "Home office" },
        ],
      },
      {
        id: "furniture_selection_03_style",
        label: "Style preference",
        type: "radio",
        required: true,
        options: [
          { value: "contemporary", label: "Contemporary" },
          { value: "mediterranean", label: "Mediterranean" },
          { value: "minimalist", label: "Minimalist" },
          { value: "eclectic", label: "Eclectic" },
          { value: "not_sure", label: "Need guidance" },
        ],
      },
      {
        id: "furniture_selection_04_service",
        label: "Service level",
        type: "radio",
        required: true,
        options: [
          { value: "consultation", label: "Consultation only" },
          { value: "sourcing", label: "Sourcing & proposals" },
          { value: "full_service", label: "Full service (order & delivery)" },
        ],
      },
      {
        id: "furniture_selection_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "within_3_months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "color-consultation",
    title: "Color Consultation",
    metadata: { category_contract: "architects-design", inspection_bias: "low" },
    questions: [
      {
        id: "color_consultation_01_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "whole_property", label: "Whole property" },
          { value: "specific_rooms", label: "Specific rooms" },
          { value: "exterior", label: "Exterior only" },
        ],
      },
      {
        id: "color_consultation_02_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "residential", label: "Residential" },
          { value: "commercial", label: "Commercial" },
          { value: "hospitality", label: "Hospitality" },
        ],
      },
      {
        id: "color_consultation_03_service",
        label: "Service needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "color_scheme", label: "Color scheme development" },
          { value: "paint_selection", label: "Paint selection" },
          { value: "material_coordination", label: "Material coordination" },
          { value: "on_site_consultation", label: "On-site consultation" },
        ],
      },
      {
        id: "color_consultation_04_preference",
        label: "Color preference",
        type: "radio",
        required: true,
        options: [
          { value: "neutral", label: "Neutral tones" },
          { value: "warm", label: "Warm colors" },
          { value: "cool", label: "Cool colors" },
          { value: "bold", label: "Bold / statement" },
          { value: "not_sure", label: "Need guidance" },
        ],
      },
      {
        id: "color_consultation_05_timeline",
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

  // ─────────────────────────────────────────────────────────────────────────
  // PROJECT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "construction-management",
    title: "Construction Management",
    metadata: { category_contract: "architects-design", inspection_bias: "high" },
    questions: [
      {
        id: "construction_management_01_type",
        label: "Project type",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "renovation", label: "Renovation" },
          { value: "extension", label: "Extension" },
          { value: "commercial", label: "Commercial fit-out" },
        ],
      },
      {
        id: "construction_management_02_size",
        label: "Project size",
        type: "radio",
        required: true,
        options: [
          { value: "small", label: "Small (< €100k)" },
          { value: "medium", label: "Medium (€100k–€500k)" },
          { value: "large", label: "Large (€500k–€1M)" },
          { value: "major", label: "Major (> €1M)" },
        ],
      },
      {
        id: "construction_management_03_status",
        label: "Project status",
        type: "radio",
        required: true,
        options: [
          { value: "planning", label: "Planning stage" },
          { value: "ready_to_start", label: "Ready to start" },
          { value: "in_progress", label: "Already in progress" },
          { value: "stalled", label: "Stalled / need help" },
        ],
      },
      {
        id: "construction_management_04_scope",
        label: "Services needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "site_supervision", label: "Site supervision" },
          { value: "quality_control", label: "Quality control" },
          { value: "schedule_management", label: "Schedule management" },
          { value: "contractor_liaison", label: "Contractor liaison" },
        ],
      },
      {
        id: "construction_management_05_timeline",
        label: "When do you need to start",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "within_3_months", label: "Within 3 months" },
        ],
      },
    ],
  },

  {
    microSlug: "contractor-coordination",
    title: "Contractor Coordination",
    metadata: { category_contract: "architects-design", inspection_bias: "medium" },
    questions: [
      {
        id: "contractor_coordination_01_type",
        label: "Project type",
        type: "radio",
        required: true,
        options: [
          { value: "renovation", label: "Renovation" },
          { value: "new_build", label: "New build" },
          { value: "fit_out", label: "Fit-out" },
          { value: "maintenance", label: "Ongoing maintenance" },
        ],
      },
      {
        id: "contractor_coordination_02_trades",
        label: "Trades to coordinate",
        type: "checkbox",
        required: true,
        options: [
          { value: "builders", label: "Builders" },
          { value: "electricians", label: "Electricians" },
          { value: "plumbers", label: "Plumbers" },
          { value: "carpenters", label: "Carpenters" },
          { value: "painters", label: "Painters" },
        ],
      },
      {
        id: "contractor_coordination_03_scope",
        label: "Coordination scope",
        type: "radio",
        required: true,
        options: [
          { value: "find_contractors", label: "Find & vet contractors" },
          { value: "schedule", label: "Schedule coordination" },
          { value: "full_management", label: "Full management" },
        ],
      },
      {
        id: "contractor_coordination_04_status",
        label: "Current status",
        type: "radio",
        required: true,
        options: [
          { value: "planning", label: "Planning stage" },
          { value: "have_contractors", label: "Have contractors, need coordination" },
          { value: "need_all", label: "Need to find contractors" },
        ],
      },
      {
        id: "contractor_coordination_05_timeline",
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
    microSlug: "budget-management",
    title: "Budget Management",
    metadata: { category_contract: "architects-design", inspection_bias: "medium" },
    questions: [
      {
        id: "budget_management_01_type",
        label: "Project type",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "renovation", label: "Renovation" },
          { value: "fit_out", label: "Commercial fit-out" },
        ],
      },
      {
        id: "budget_management_02_budget",
        label: "Budget range",
        type: "radio",
        required: true,
        options: [
          { value: "under_100k", label: "Under €100k" },
          { value: "100_250k", label: "€100k–€250k" },
          { value: "250_500k", label: "€250k–€500k" },
          { value: "over_500k", label: "Over €500k" },
        ],
      },
      {
        id: "budget_management_03_scope",
        label: "Services needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "cost_planning", label: "Cost planning" },
          { value: "tender_management", label: "Tender management" },
          { value: "payment_scheduling", label: "Payment scheduling" },
          { value: "cost_tracking", label: "Cost tracking" },
        ],
      },
      {
        id: "budget_management_04_status",
        label: "Project status",
        type: "radio",
        required: true,
        options: [
          { value: "pre_project", label: "Pre-project (planning)" },
          { value: "in_progress", label: "Project in progress" },
          { value: "cost_overrun", label: "Experiencing cost overruns" },
        ],
      },
      {
        id: "budget_management_05_timeline",
        label: "When do you need help",
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

  // ─────────────────────────────────────────────────────────────────────────
  // 3D VISUALIZATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "3d-rendering",
    title: "3D Rendering",
    metadata: { category_contract: "architects-design", inspection_bias: "low" },
    questions: [
      {
        id: "3d_rendering_01_type",
        label: "Rendering type",
        type: "radio",
        required: true,
        options: [
          { value: "exterior", label: "Exterior views" },
          { value: "interior", label: "Interior views" },
          { value: "both", label: "Both" },
        ],
      },
      {
        id: "3d_rendering_02_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "planning", label: "Planning application" },
          { value: "marketing", label: "Marketing / sales" },
          { value: "personal", label: "Personal visualization" },
          { value: "presentation", label: "Client presentation" },
        ],
      },
      {
        id: "3d_rendering_03_quantity",
        label: "Number of views",
        type: "radio",
        required: true,
        options: [
          { value: "1_2", label: "1–2 views" },
          { value: "3_5", label: "3–5 views" },
          { value: "6_10", label: "6–10 views" },
          { value: "10_plus", label: "10+ views" },
        ],
      },
      {
        id: "3d_rendering_04_quality",
        label: "Quality level",
        type: "radio",
        required: true,
        options: [
          { value: "standard", label: "Standard" },
          { value: "high", label: "High quality" },
          { value: "photorealistic", label: "Photorealistic" },
        ],
      },
      {
        id: "3d_rendering_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (< 1 week)" },
          { value: "standard", label: "Standard (2–3 weeks)" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "3d_rendering_06_files",
        label: "Upload plans / drawings",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf", ".dwg", ".dxf"],
      },
    ],
  },

  {
    microSlug: "virtual-walkthrough",
    title: "Virtual Walkthrough",
    metadata: { category_contract: "architects-design", inspection_bias: "low" },
    questions: [
      {
        id: "virtual_walkthrough_01_type",
        label: "Walkthrough type",
        type: "radio",
        required: true,
        options: [
          { value: "360_tour", label: "360° tour" },
          { value: "video_animation", label: "Video animation" },
          { value: "vr_experience", label: "VR experience" },
        ],
      },
      {
        id: "virtual_walkthrough_02_scope",
        label: "Scope",
        type: "radio",
        required: true,
        options: [
          { value: "single_room", label: "Single room" },
          { value: "multiple_rooms", label: "Multiple rooms" },
          { value: "whole_property", label: "Whole property" },
          { value: "exterior_included", label: "Interior + exterior" },
        ],
      },
      {
        id: "virtual_walkthrough_03_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "marketing", label: "Marketing / sales" },
          { value: "planning", label: "Planning visualization" },
          { value: "client_approval", label: "Client approval" },
        ],
      },
      {
        id: "virtual_walkthrough_04_quality",
        label: "Quality level",
        type: "radio",
        required: true,
        options: [
          { value: "standard", label: "Standard" },
          { value: "high", label: "High quality" },
          { value: "premium", label: "Premium / cinematic" },
        ],
      },
      {
        id: "virtual_walkthrough_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (< 2 weeks)" },
          { value: "standard", label: "Standard (3–4 weeks)" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "floor-plans",
    title: "Floor Plans",
    metadata: { category_contract: "architects-design", inspection_bias: "low" },
    questions: [
      {
        id: "floor_plans_01_type",
        label: "Floor plan type",
        type: "radio",
        required: true,
        options: [
          { value: "2d_basic", label: "2D basic" },
          { value: "2d_furnished", label: "2D with furniture" },
          { value: "3d_floor_plan", label: "3D floor plan" },
        ],
      },
      {
        id: "floor_plans_02_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "real_estate", label: "Real estate listing" },
          { value: "renovation_planning", label: "Renovation planning" },
          { value: "space_planning", label: "Space planning" },
          { value: "permit_application", label: "Permit application" },
        ],
      },
      {
        id: "floor_plans_03_floors",
        label: "Number of floors",
        type: "radio",
        required: true,
        options: [
          { value: "1", label: "1 floor" },
          { value: "2", label: "2 floors" },
          { value: "3_plus", label: "3+ floors" },
        ],
      },
      {
        id: "floor_plans_04_source",
        label: "What do you have",
        type: "radio",
        required: true,
        options: [
          { value: "existing_plans", label: "Existing plans" },
          { value: "measurements", label: "Measurements" },
          { value: "need_survey", label: "Need property survey" },
        ],
      },
      {
        id: "floor_plans_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (< 1 week)" },
          { value: "standard", label: "Standard (1–2 weeks)" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "floor_plans_06_files",
        label: "Upload existing plans / sketches",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },
];
