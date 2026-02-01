/**
 * Gardening & Landscaping Question Packs
 * Defines questions for all gardening & landscaping microservices
 */

// Inline type definitions for Deno environment (canonical types only)
type QuestionType = 'single' | 'multi' | 'scale' | 'text' | 'number' | 'yesno' | 'file';

interface QuestionOption {
  value: string;
  label: string;
}

interface QuestionDef {
  id: string;
  question: string;
  type: QuestionType;
  required?: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  accept?: string;
}

interface MicroservicePack {
  microSlug: string;
  subcategorySlug: string;
  categorySlug: string;
  version: number;
  questions: QuestionDef[];
}

/**
 * Generic Gardening & Landscaping pack – works for most services.
 */
const buildGenericGardeningPack = (
  microSlug: string,
  readableName: string,
  subcategorySlug: string
): MicroservicePack => {
  const questions: QuestionDef[] = [
    {
      id: "property_type",
      question: "What type of property is this?",
      type: "single",
      required: true,
      options: [
        { value: "apartment", label: "Apartment with terrace / garden" },
        { value: "villa_house", label: "Villa / house" },
        { value: "finca_rustic", label: "Finca / rustic property" },
        { value: "community", label: "Community / apartment complex" },
        { value: "hotel_guesthouse", label: "Hotel / guesthouse" },
        { value: "commercial", label: "Commercial property" }
      ]
    },
    {
      id: "garden_area_type",
      question: "What type of outdoor areas are involved?",
      type: "multi",
      required: false,
      options: [
        { value: "front_garden", label: "Front garden" },
        { value: "rear_garden", label: "Rear garden" },
        { value: "side_garden", label: "Side garden / access areas" },
        { value: "terraces", label: "Terraces / patios" },
        { value: "driveway_parking", label: "Driveway / parking areas" },
        { value: "communal_areas", label: "Communal garden / pool area" }
      ]
    },
    {
      id: "approx_size",
      question: "Do you know roughly how big the garden or area is?",
      type: "single",
      required: false,
      options: [
        { value: "small_under_50", label: "Small – up to 50 m²" },
        { value: "medium_50_200", label: "Medium – 50–200 m²" },
        { value: "large_200_500", label: "Large – 200–500 m²" },
        { value: "very_large_500_plus", label: "Very large – 500 m²+" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "access",
      question: "How is access to the garden / work area?",
      type: "single",
      required: false,
      options: [
        { value: "easy_vehicle", label: "Easy – vehicle access close by" },
        { value: "through_house", label: "Through the house / building" },
        { value: "narrow_access", label: "Narrow access / many steps" },
        { value: "steep_or_uneven", label: "Steep / uneven terrain" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "water_source",
      question: "What water source is available for the garden?",
      type: "single",
      required: false,
      options: [
        { value: "mains_tap", label: "Standard mains tap(s)" },
        { value: "existing_irrigation", label: "Existing irrigation system" },
        { value: "well_deposit", label: "Well / deposit / cisterna" },
        { value: "none", label: "No easy water supply" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "urgency",
      question: "How urgent is this job?",
      type: "single",
      required: true,
      options: [
        { value: "emergency_safety", label: "Urgent – safety issue (fallen trees, etc.)" },
        { value: "soon", label: "Soon – within 1–2 weeks" },
        { value: "this_month", label: "Within this month" },
        { value: "flexible", label: "Flexible / planning ahead" }
      ]
    },
    {
      id: "photos",
      question: "Do you have any photos or videos of the garden / area?",
      type: "file",
      required: false,
      accept: "image/*,video/*"
    }
  ];

  return {
    microSlug,
    subcategorySlug,
    categorySlug: "gardening-landscaping",
    version: 1,
    questions
  };
};

/**
 * Detailed pack: Regular garden maintenance
 */
const regularGardenMaintenancePack: MicroservicePack = {
  microSlug: "regular-garden-maintenance",
  subcategorySlug: "garden-maintenance",
  categorySlug: "gardening-landscaping",
  version: 1,
  questions: [
    {
      id: "service_frequency",
      question: "How often would you like garden maintenance?",
      type: "single",
      required: true,
      options: [
        { value: "weekly", label: "Weekly" },
        { value: "fortnightly", label: "Every two weeks" },
        { value: "monthly", label: "Once per month" },
        { value: "seasonal", label: "Only seasonal visits (spring, summer, etc.)" },
        { value: "one_off", label: "One-off tidy / clean-up" }
      ]
    },
    {
      id: "tasks_required",
      question: "Which tasks should be included in the maintenance?",
      type: "multi",
      required: true,
      options: [
        { value: "mowing", label: "Lawn mowing / edging" },
        { value: "weeding", label: "Weeding beds / borders" },
        { value: "pruning", label: "Pruning shrubs / plants" },
        { value: "leaf_clearance", label: "Leaf and debris clearance" },
        { value: "hedge_trimming", label: "Hedge trimming" },
        { value: "blowing_cleaning", label: "Blowing / general clean-up" },
        { value: "pool_area_clean", label: "Pool area plants / tidy" }
      ]
    },
    {
      id: "green_waste",
      question: "What should happen with green waste?",
      type: "single",
      required: true,
      options: [
        { value: "contractor_remove", label: "Contractor to remove and dispose" },
        { value: "on_site_compost", label: "Leave on site (compost / agreed area)" },
        { value: "mixed", label: "Mixed – some removed, some can stay" }
      ]
    },
    {
      id: "garden_complexity",
      question: "How would you describe the garden?",
      type: "single",
      required: false,
      options: [
        { value: "simple", label: "Simple – mostly lawn and a few beds" },
        { value: "medium", label: "Medium – mixed planting, some trees" },
        { value: "complex", label: "Complex – many plants, levels, or features" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "access_arrangement",
      question: "How will the gardener access the property?",
      type: "single",
      required: false,
      options: [
        { value: "gate_code", label: "Gate code / key code access" },
        { value: "key_collection", label: "Key collection required" },
        { value: "on_site_staff", label: "On-site staff will assist" },
        { value: "always_open", label: "Always open / no restriction" },
        { value: "other", label: "Other (add details in notes)" }
      ]
    },
    {
      id: "start_date",
      question: "When would you like the maintenance to start?",
      type: "single",
      required: true,
      options: [
        { value: "asap", label: "As soon as possible" },
        { value: "next_week", label: "From next week" },
        { value: "next_month", label: "From next month" },
        { value: "specific_date", label: "On a specific date (add in notes)" }
      ]
    }
  ]
};

/**
 * Detailed pack: Garden redesign & new landscaping
 */
const gardenRedesignLandscapingPack: MicroservicePack = {
  microSlug: "garden-redesign-landscaping",
  subcategorySlug: "garden-design-landscaping",
  categorySlug: "gardening-landscaping",
  version: 1,
  questions: [
    {
      id: "project_scope",
      question: "What best describes your project?",
      type: "single",
      required: true,
      options: [
        { value: "refresh_existing", label: "Refresh / improve existing layout" },
        { value: "full_redesign", label: "Full redesign of the garden" },
        { value: "new_garden", label: "New garden for newly built property" },
        { value: "specific_area", label: "Work on a specific area only" }
      ]
    },
    {
      id: "features_interest",
      question: "Which features are you interested in including or improving?",
      type: "multi",
      required: false,
      options: [
        { value: "lawns", label: "Lawns / turf" },
        { value: "planting_beds", label: "Planting beds / borders" },
        { value: "trees_shrubs", label: "Trees and structural shrubs" },
        { value: "paths_terraces", label: "Paths, terraces, and seating areas" },
        { value: "retaining_walls", label: "Retaining walls / levels" },
        { value: "water_feature", label: "Water feature / pond / fountain" },
        { value: "lighting", label: "Garden lighting" },
        { value: "fire_bbq", label: "Firepit / BBQ / outdoor kitchen" }
      ]
    },
    {
      id: "style_preference",
      question: "Do you have a preferred garden style?",
      type: "single",
      required: false,
      options: [
        { value: "mediterranean", label: "Mediterranean / drought-tolerant" },
        { value: "modern_minimal", label: "Modern / minimal" },
        { value: "lush_tropical", label: "Lush / tropical feel" },
        { value: "natural_rustic", label: "Natural / rustic" },
        { value: "not_sure", label: "Not sure – open to ideas" }
      ]
    },
    {
      id: "irrigation_consideration",
      question: "Would you like to include or upgrade an irrigation system?",
      type: "single",
      required: false,
      options: [
        { value: "new_irrigation", label: "Yes – new irrigation system" },
        { value: "upgrade_existing", label: "Upgrade existing irrigation" },
        { value: "manual_watering", label: "No – happy with manual watering" },
        { value: "not_sure", label: "Not sure yet" }
      ]
    },
    {
      id: "budget_range",
      question: "Do you have a budget range in mind for the landscaping work?",
      type: "single",
      required: false,
      options: [
        { value: "under_5k", label: "Under €5k" },
        { value: "5k_15k", label: "€5k–€15k" },
        { value: "15k_40k", label: "€15k–€40k" },
        { value: "over_40k", label: "Over €40k" },
        { value: "not_sure", label: "Not sure yet" }
      ]
    },
    {
      id: "design_support",
      question: "Do you need full design support (plans, mood boards, plant lists)?",
      type: "single",
      required: false,
      options: [
        { value: "yes_full_design", label: "Yes – full design service" },
        { value: "partial_design", label: "Some design guidance only" },
        { value: "no_just_build", label: "No – I already have a design" }
      ]
    },
    {
      id: "timeline",
      question: "When would you like the landscaping project to take place?",
      type: "single",
      required: true,
      options: [
        { value: "asap", label: "As soon as possible" },
        { value: "this_season", label: "This season" },
        { value: "off_season", label: "Prefer off-season / quieter times" },
        { value: "flexible", label: "Flexible" }
      ]
    }
  ]
};

/**
 * Detailed pack: Irrigation system install / repair
 */
const irrigationSystemPack: MicroservicePack = {
  microSlug: "irrigation-system-installation",
  subcategorySlug: "irrigation-systems",
  categorySlug: "gardening-landscaping",
  version: 1,
  questions: [
    {
      id: "irrigation_project_type",
      question: "Is this a new irrigation system or work on an existing one?",
      type: "single",
      required: true,
      options: [
        { value: "new_system", label: "New irrigation system" },
        { value: "extend_system", label: "Extend existing system" },
        { value: "repair_system", label: "Repairs to existing system" },
        { value: "check_optimize", label: "Check / optimise existing system" }
      ]
    },
    {
      id: "area_coverage",
      question: "Which areas need to be covered by irrigation?",
      type: "multi",
      required: true,
      options: [
        { value: "lawns", label: "Lawns / grass areas" },
        { value: "beds_borders", label: "Beds / borders" },
        { value: "pots_planters", label: "Pots and planters" },
        { value: "hedges_trees", label: "Hedges / trees" }
      ]
    },
    {
      id: "water_source_detail",
      question: "What water source will be used?",
      type: "single",
      required: true,
      options: [
        { value: "mains", label: "Mains water" },
        { value: "well", label: "Well / borehole" },
        { value: "deposit", label: "Deposit / cisterna" },
        { value: "mixed", label: "Mixed sources" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "control_type",
      question: "What type of control would you like?",
      type: "single",
      required: false,
      options: [
        { value: "manual_tap", label: "Manual (tap on/off)" },
        { value: "timer_control", label: "Timer control" },
        { value: "smart_wifi", label: "Smart / Wi-Fi controller" },
        { value: "not_sure", label: "Not sure – need advice" }
      ]
    },
    {
      id: "existing_issues",
      question: "If you already have a system, what issues are you experiencing?",
      type: "multi",
      required: false,
      options: [
        { value: "leaks", label: "Leaks / broken pipes" },
        { value: "blocked_drippers", label: "Blocked drippers / sprinklers" },
        { value: "uneven_coverage", label: "Uneven coverage" },
        { value: "controller_problems", label: "Timer / controller problems" },
        { value: "high_consumption", label: "High water usage / bills" }
      ]
    },
    {
      id: "budget_range",
      question: "Do you have a budget range for the irrigation work?",
      type: "single",
      required: false,
      options: [
        { value: "under_2k", label: "Under €2k" },
        { value: "2k_5k", label: "€2k–€5k" },
        { value: "5k_10k", label: "€5k–€10k" },
        { value: "over_10k", label: "Over €10k" },
        { value: "not_sure", label: "Not sure yet" }
      ]
    },
    {
      id: "timeline",
      question: "When would you like the irrigation work to be done?",
      type: "single",
      required: true,
      options: [
        { value: "asap", label: "As soon as possible" },
        { value: "before_summer", label: "Before the main summer season" },
        { value: "after_summer", label: "After summer / off-season" },
        { value: "flexible", label: "Flexible" }
      ]
    }
  ]
};

/**
 * Detailed pack: Garden & Lawn Fertilization
 */
const fertilizationPack: MicroservicePack = {
  microSlug: "fertilization",
  subcategorySlug: "lawn-care-turfing",
  categorySlug: "gardening-landscaping",
  version: 1,
  questions: [
    {
      id: "area_type",
      question: "Which areas need fertilizing?",
      type: "single",
      required: true,
      options: [
        { value: "lawn", label: "Lawn" },
        { value: "flower_beds", label: "Flower beds" },
        { value: "trees_shrubs", label: "Trees/shrubs" },
        { value: "vegetable_garden", label: "Vegetable garden" },
        { value: "whole_garden", label: "Whole garden area" }
      ]
    },
    {
      id: "garden_size",
      question: "What is the approximate size of the garden?",
      type: "single",
      required: true,
      options: [
        { value: "small", label: "Small (up to 50m²)" },
        { value: "medium", label: "Medium (50–150m²)" },
        { value: "large", label: "Large (150–300m²)" },
        { value: "very_large", label: "Very large (300m²+)" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "fertilizer_type",
      question: "Do you have a preferred type of fertilizer?",
      type: "single",
      required: false,
      options: [
        { value: "organic", label: "Organic" },
        { value: "chemical", label: "Chemical/standard" },
        { value: "slow_release", label: "Slow-release" },
        { value: "liquid", label: "Liquid feed" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "condition",
      question: "What condition is the lawn/garden currently in?",
      type: "single",
      required: false,
      options: [
        { value: "healthy", label: "Healthy" },
        { value: "patchy", label: "Patchy" },
        { value: "dry_burned", label: "Dry/burned areas" },
        { value: "weeds", label: "Weeds present" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "watering",
      question: "Is irrigation or watering available?",
      type: "single",
      required: false,
      options: [
        { value: "sprinkler", label: "Sprinkler system" },
        { value: "hose", label: "Hose access" },
        { value: "cans", label: "Watering cans only" },
        { value: "no_access", label: "No easy access" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "frequency",
      question: "How often do you need fertilization services?",
      type: "single",
      required: true,
      options: [
        { value: "one_time", label: "One-time treatment" },
        { value: "monthly", label: "Monthly" },
        { value: "seasonal", label: "Seasonal" },
        { value: "custom", label: "Custom schedule" }
      ]
    }
  ]
};

/**
 * Detailed pack: Lawn Mowing
 */
const lawnMowingPack: MicroservicePack = {
  microSlug: "lawn-mowing",
  subcategorySlug: "lawn-care-turfing",
  categorySlug: "gardening-landscaping",
  version: 1,
  questions: [
    {
      id: "lawn_size",
      question: "What is the approximate size of the lawn?",
      type: "single",
      required: true,
      options: [
        { value: "small", label: "Small (up to 50m²)" },
        { value: "medium", label: "Medium (50–150m²)" },
        { value: "large", label: "Large (150–300m²)" },
        { value: "very_large", label: "Very large (300m²+)" },
        { value: "multiple", label: "Multiple lawn areas" }
      ]
    },
    {
      id: "grass_length",
      question: "What is the current grass length?",
      type: "single",
      required: true,
      options: [
        { value: "short", label: "Short/regularly maintained" },
        { value: "overgrown", label: "Overgrown" },
        { value: "very_long", label: "Very long" },
        { value: "mixed", label: "Mixed areas" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "obstacles",
      question: "Are there obstacles in the lawn?",
      type: "single",
      required: false,
      options: [
        { value: "trees_shrubs", label: "Trees/shrubs" },
        { value: "flower_beds", label: "Flower beds" },
        { value: "furniture", label: "Garden furniture" },
        { value: "slopes", label: "Slopes/uneven ground" },
        { value: "clear", label: "Clear/open lawn" }
      ]
    },
    {
      id: "clippings",
      question: "What should be done with the grass clippings?",
      type: "single",
      required: true,
      options: [
        { value: "leave_mulch", label: "Leave on lawn (mulch)" },
        { value: "collect_dispose", label: "Collect and dispose" },
        { value: "collect_leave", label: "Collect but leave on site" },
        { value: "no_preference", label: "No preference" }
      ]
    },
    {
      id: "frequency",
      question: "How often do you need mowing?",
      type: "single",
      required: true,
      options: [
        { value: "one_time", label: "One-time cut" },
        { value: "weekly", label: "Weekly" },
        { value: "fortnightly", label: "Fortnightly" },
        { value: "monthly", label: "Monthly" },
        { value: "custom", label: "Custom schedule" }
      ]
    },
    {
      id: "access",
      question: "How is access to the garden?",
      type: "single",
      required: false,
      options: [
        { value: "easy", label: "Easy access" },
        { value: "gate", label: "Side gate access" },
        { value: "house", label: "Through the house" },
        { value: "restricted", label: "Restricted/steps" },
        { value: "not_sure", label: "Not sure" }
      ]
    }
  ]
};

/**
 * Detailed pack: Tree Trimming
 */
const treeTrimmingPack: MicroservicePack = {
  microSlug: "tree-trimming",
  subcategorySlug: "tree-hedge-care",
  categorySlug: "gardening-landscaping",
  version: 1,
  questions: [
    {
      id: "tree_type",
      question: "What type of trees need trimming?",
      type: "single",
      required: true,
      options: [
        { value: "palm", label: "Palm trees" },
        { value: "fruit", label: "Fruit trees" },
        { value: "conifers", label: "Conifers" },
        { value: "mature", label: "Large mature trees" },
        { value: "multiple", label: "Multiple types" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "tree_height",
      question: "What is the approximate height of the tree(s)?",
      type: "single",
      required: true,
      options: [
        { value: "up_to_3m", label: "Up to 3m" },
        { value: "3_5m", label: "3–5m" },
        { value: "5_8m", label: "5–8m" },
        { value: "8_12m", label: "8–12m" },
        { value: "over_12m", label: "12m+" },
        { value: "mixed", label: "Mixed heights" }
      ]
    },
    {
      id: "work_required",
      question: "What type of trimming is needed?",
      type: "single",
      required: true,
      options: [
        { value: "light_shaping", label: "Light shaping" },
        { value: "crown_lift", label: "Crown lift" },
        { value: "crown_reduction", label: "Crown reduction" },
        { value: "deadwood", label: "Deadwood removal" },
        { value: "heavy_prune", label: "Heavy trim/pruning" },
        { value: "unsure", label: "Unsure" }
      ]
    },
    {
      id: "waste_disposal",
      question: "Do you need waste removed?",
      type: "single",
      required: true,
      options: [
        { value: "remove_all", label: "Yes, remove all waste" },
        { value: "leave_site", label: "Leave waste on site" },
        { value: "chip_site", label: "Chipped on site" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "access",
      question: "How is access to the tree(s)?",
      type: "single",
      required: false,
      options: [
        { value: "easy", label: "Easy access" },
        { value: "narrow", label: "Narrow access" },
        { value: "house", label: "Through house" },
        { value: "sloped", label: "Sloped/uneven ground" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "equipment",
      question: "Is specialist equipment required?",
      type: "single",
      required: false,
      options: [
        { value: "ladder", label: "Ladder only" },
        { value: "cherry_picker", label: "Cherry picker" },
        { value: "climbing", label: "Climbing gear" },
        { value: "chainsaw", label: "Chainsaw work" },
        { value: "unsure", label: "Unsure" }
      ]
    }
  ]
};

const genericGardeningServices: {
  microSlug: string;
  name: string;
  subcategorySlug: string;
}[] = [
  // Garden maintenance (others)
  { microSlug: "one-off-garden-cleanup",          name: "One-off garden clean-up / jungle clear",     subcategorySlug: "garden-maintenance" },
  { microSlug: "seasonal-pruning-preparation",    name: "Seasonal pruning & preparation",             subcategorySlug: "garden-maintenance" },
  { microSlug: "holiday-garden-checks",           name: "Holiday garden checks & watering",           subcategorySlug: "garden-maintenance" },

  // Garden design & landscaping (others)
  { microSlug: "new-lawn-turf-installation",      name: "New lawn / turf installation",               subcategorySlug: "garden-design-landscaping" },
  { microSlug: "gravel-paths-dry-gardens",        name: "Gravel paths & dry gardens",                 subcategorySlug: "garden-design-landscaping" },
  { microSlug: "retaining-walls-and-borders",     name: "Retaining walls & raised beds",              subcategorySlug: "garden-design-landscaping" },
  { microSlug: "garden-steps-and-levels",         name: "Garden steps / levels",                      subcategorySlug: "garden-design-landscaping" },

  // Irrigation (others)
  { microSlug: "irrigation-repairs-leaks",        name: "Irrigation repairs & leak fixing",           subcategorySlug: "irrigation-systems" },
  { microSlug: "irrigation-check-and-setup",      name: "Irrigation check, setup & programming",      subcategorySlug: "irrigation-systems" },

  // Tree & hedge care
  { microSlug: "hedge-cutting-shaping",           name: "Hedge cutting & shaping",                    subcategorySlug: "tree-hedge-care" },
  { microSlug: "tree-pruning-reduction",          name: "Tree pruning & reduction",                   subcategorySlug: "tree-hedge-care" },
  { microSlug: "palm-tree-maintenance",           name: "Palm tree maintenance & cleaning",           subcategorySlug: "tree-hedge-care" },
  { microSlug: "tree-felling-stump-removal",      name: "Tree felling & stump removal",               subcategorySlug: "tree-hedge-care" },

  // Lawn care & turfing
  { microSlug: "lawn-treatment-and-feeding",      name: "Lawn treatment & feeding",                   subcategorySlug: "lawn-care-turfing" },
  { microSlug: "lawn-repair-overseeding",         name: "Lawn repair & overseeding",                  subcategorySlug: "lawn-care-turfing" },
  { microSlug: "artificial-grass-installation",   name: "Artificial grass installation",              subcategorySlug: "lawn-care-turfing" }
];

const genericGardeningPacks: MicroservicePack[] = genericGardeningServices.map(s =>
  buildGenericGardeningPack(s.microSlug, s.name, s.subcategorySlug)
);

export const gardeningLandscapingQuestionPacks: MicroservicePack[] = [
  regularGardenMaintenancePack,
  gardenRedesignLandscapingPack,
  irrigationSystemPack,
  fertilizationPack,
  lawnMowingPack,
  treeTrimmingPack,
  ...genericGardeningPacks
];
