/**
 * Plumbing Emergency Question Packs
 * 3 detailed emergency micro-service question packs
 */

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDef {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'file';
  required: boolean;
  placeholder?: string;
  accept?: string;
  options?: QuestionOption[];
}

export interface MicroservicePack {
  microSlug: string;
  subcategorySlug: string;
  categorySlug: string;
  version: number;
  questions: QuestionDef[];
}

/**
 * Detailed pack: Burst pipe
 */
const burstPipePack: MicroservicePack = {
  microSlug: "burst-pipe",
  subcategorySlug: "emergency-plumbing",
  categorySlug: "plumbing",
  version: 1,
  questions: [
    {
      id: "pipe_location",
      question: "Where is the burst pipe located?",
      type: "radio",
      required: true,
      options: [
        { value: "kitchen", label: "Kitchen" },
        { value: "bathroom", label: "Bathroom" },
        { value: "utility", label: "Utility room" },
        { value: "under_floor", label: "Under floor" },
        { value: "outside", label: "Outside" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "water_flow",
      question: "What best describes the water flow?",
      type: "radio",
      required: true,
      options: [
        { value: "slow_drip", label: "Slow drip" },
        { value: "steady_leak", label: "Steady leak" },
        { value: "fast_flow", label: "Fast flow" },
        { value: "spraying", label: "Spraying water" },
        { value: "stopped", label: "Stopped but pipe damaged" }
      ]
    },
    {
      id: "water_isolation",
      question: "Have you been able to turn off the water?",
      type: "radio",
      required: true,
      options: [
        { value: "main_off", label: "Yes, main stop tap off" },
        { value: "local_only", label: "Yes, local isolation only" },
        { value: "cannot_find", label: "No, cannot find stop tap" },
        { value: "valve_stuck", label: "No, valve will not turn" },
        { value: "not_tried", label: "Not tried yet" }
      ]
    },
    {
      id: "pipe_type",
      question: "What type of pipe is affected?",
      type: "radio",
      required: true,
      options: [
        { value: "copper", label: "Copper" },
        { value: "plastic", label: "Plastic (PEX)" },
        { value: "waste", label: "Waste pipe" },
        { value: "heating", label: "Heating pipe (radiator)" },
        { value: "unsure", label: "Unsure" }
      ]
    },
    {
      id: "visible_damage",
      question: "Is there visible damage to surrounding areas?",
      type: "radio",
      required: true,
      options: [
        { value: "ceiling", label: "Ceiling damage" },
        { value: "wall", label: "Wall damage" },
        { value: "flooring", label: "Flooring damaged" },
        { value: "no_damage", label: "No visible damage" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "property_type",
      question: "What type of property is it?",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "terraced", label: "Terraced house" },
        { value: "semi", label: "Semi-detached" },
        { value: "detached", label: "Detached house" },
        { value: "commercial", label: "Commercial unit" }
      ]
    }
  ]
};

/**
 * Detailed pack: Sewer backup
 */
const sewerBackupPack: MicroservicePack = {
  microSlug: "sewer-backup",
  subcategorySlug: "drainage",
  categorySlug: "plumbing",
  version: 1,
  questions: [
    {
      id: "symptoms",
      question: "What problems are you experiencing?",
      type: "radio",
      required: true,
      options: [
        { value: "toilets", label: "Toilets not flushing properly" },
        { value: "multiple_drains", label: "Multiple drains backing up" },
        { value: "water_up", label: "Water coming up in shower/bath" },
        { value: "bad_smells", label: "Bad smells from drains" },
        { value: "manhole", label: "Manhole overflowing" }
      ]
    },
    {
      id: "affected_areas",
      question: "Which areas are affected?",
      type: "radio",
      required: true,
      options: [
        { value: "single_bathroom", label: "Single bathroom" },
        { value: "multiple_bathrooms", label: "Multiple bathrooms" },
        { value: "kitchen_bathroom", label: "Kitchen and bathroom" },
        { value: "outdoor", label: "Outdoor drains/manholes" },
        { value: "whole_property", label: "Whole property" }
      ]
    },
    {
      id: "property_type",
      question: "What type of property is this?",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "terraced", label: "Terraced house" },
        { value: "semi", label: "Semi-detached" },
        { value: "detached", label: "Detached house" },
        { value: "commercial", label: "Commercial building" }
      ]
    },
    {
      id: "previous_issues",
      question: "Have you had similar drainage issues before?",
      type: "radio",
      required: true,
      options: [
        { value: "recurring", label: "Yes, recurring problem" },
        { value: "once", label: "Yes, once before" },
        { value: "first_time", label: "No, first time" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "access_points",
      question: "Are there accessible manholes or inspection points?",
      type: "radio",
      required: true,
      options: [
        { value: "easy", label: "Yes, easy access" },
        { value: "heavy", label: "Yes, but covers are heavy" },
        { value: "unsure_location", label: "Unsure where they are" },
        { value: "no_visible", label: "No visible access points" }
      ]
    },
    {
      id: "building_occupancy",
      question: "Is this affecting a single unit or shared system?",
      type: "radio",
      required: true,
      options: [
        { value: "single", label: "Single private property" },
        { value: "shared_neighbours", label: "Shared drain with neighbours" },
        { value: "apartment_block", label: "Apartment block/shared stack" },
        { value: "not_sure", label: "Not sure" }
      ]
    }
  ]
};

/**
 * Detailed pack: Water heater emergency
 */
const waterHeaterEmergencyPack: MicroservicePack = {
  microSlug: "water-heater-emergency",
  subcategorySlug: "hot-water-systems",
  categorySlug: "plumbing",
  version: 1,
  questions: [
    {
      id: "system_type",
      question: "What type of hot water system do you have?",
      type: "radio",
      required: true,
      options: [
        { value: "tank", label: "Tank water heater (cylinder)" },
        { value: "combi", label: "Combi boiler" },
        { value: "electric", label: "Electric water heater" },
        { value: "gas", label: "Gas water heater" },
        { value: "heat_pump", label: "Heat pump system" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "main_issue",
      question: "What is the main issue?",
      type: "radio",
      required: true,
      options: [
        { value: "no_hot_water", label: "No hot water" },
        { value: "leaking", label: "Leaking from tank or pipes" },
        { value: "too_hot", label: "Water too hot" },
        { value: "noises", label: "Strange noises from unit" },
        { value: "discoloured", label: "Water discoloured" },
        { value: "error", label: "Error light or code showing" }
      ]
    },
    {
      id: "leak_severity",
      question: "If there is a leak, how would you describe it?",
      type: "radio",
      required: true,
      options: [
        { value: "no_leak", label: "No leak" },
        { value: "slow_drip", label: "Slow drip" },
        { value: "steady", label: "Steady leak" },
        { value: "fast", label: "Fast leak" },
        { value: "unsure", label: "Unsure" }
      ]
    },
    {
      id: "isolation",
      question: "Have you turned off any power or water supplies?",
      type: "radio",
      required: true,
      options: [
        { value: "water_only", label: "Water off only" },
        { value: "power_only", label: "Power/gas off only" },
        { value: "both", label: "Both water and power/gas off" },
        { value: "nothing", label: "No, nothing turned off" },
        { value: "not_sure_how", label: "Not sure how to" }
      ]
    },
    {
      id: "location",
      question: "Where is the water heater located?",
      type: "radio",
      required: true,
      options: [
        { value: "kitchen", label: "Kitchen cupboard" },
        { value: "utility", label: "Utility room" },
        { value: "loft", label: "Loft/attic" },
        { value: "garage", label: "Garage" },
        { value: "outside", label: "Outside/plant room" },
        { value: "other", label: "Other/unsure" }
      ]
    },
    {
      id: "age",
      question: "Approximate age of the system?",
      type: "radio",
      required: true,
      options: [
        { value: "0_5", label: "0–5 years" },
        { value: "5_10", label: "5–10 years" },
        { value: "10_15", label: "10–15 years" },
        { value: "15_plus", label: "15+ years" },
        { value: "not_sure", label: "Not sure" }
      ]
    }
  ]
};

export const plumbingQuestionPacks: MicroservicePack[] = [
  burstPipePack,
  sewerBackupPack,
  waterHeaterEmergencyPack
];
