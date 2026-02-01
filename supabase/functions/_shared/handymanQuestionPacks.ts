/**
 * Handyman & General Services Question Packs
 * Defines all micro-service question sets for Handyman category
 */

// Define types inline to avoid import issues in Deno
type QuestionOption = { value: string; label: string };

type QuestionDef = {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  helpText?: string;
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
};

export type MicroservicePackContent = {
  microSlug: string;
  subcategorySlug: string;
  name: string;
  questions: QuestionDef[];
};

/**
 * Generic Handyman pack – works for most handyman-type services.
 */
function buildGenericHandymanPack(
  slug: string,
  name: string,
  subcategorySlug: string
): MicroservicePackContent {
  const questions: QuestionDef[] = [
    {
      id: "job_description",
      question: `Briefly describe what you need for "${name}".`,
      type: "textarea",
      required: true,
      placeholder: "What needs doing, where in the property, and anything important?"
    },
    {
      id: "property_type",
      question: "What type of property is it?",
      type: "select",
      required: true,
      options: [
        { value: "apartment", label: "Apartment" },
        { value: "house", label: "House" },
        { value: "villa", label: "Villa" },
        { value: "commercial", label: "Commercial property" },
        { value: "other", label: "Other" }
      ]
    },
    {
      id: "rooms_areas",
      question: "Which rooms or areas are involved?",
      type: "checkbox",
      required: true,
      options: [
        { value: "hallway", label: "Hallway / entrance" },
        { value: "living", label: "Living / dining areas" },
        { value: "bedrooms", label: "Bedrooms" },
        { value: "kitchen", label: "Kitchen" },
        { value: "bathrooms", label: "Bathrooms" },
        { value: "outdoor", label: "Outdoor / terrace / garden" },
        { value: "other", label: "Other areas" }
      ]
    },
    {
      id: "height_ladder",
      question: "Does any work need a ladder or working at height?",
      type: "radio",
      required: false,
      options: [
        { value: "no", label: "No – all at normal height" },
        { value: "step_ladder", label: "Step ladder only" },
        { value: "tall_ladder", label: "Tall ladder or high ceiling" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "materials_supplied",
      question: "Who will provide materials and fixings (screws, brackets, etc.)?",
      type: "radio",
      required: true,
      options: [
        { value: "client", label: "I will provide everything" },
        { value: "handyman", label: "Handyman to supply" },
        { value: "mixed", label: "A mix of both" },
        { value: "not_sure", label: "Not sure yet" }
      ]
    },
    {
      id: "urgency",
      question: "How urgent is this job?",
      type: "select",
      required: true,
      options: [
        { value: "emergency_today", label: "Very urgent – today if possible" },
        { value: "this_week", label: "This week" },
        { value: "next_week", label: "Next week" },
        { value: "flexible", label: "Flexible" }
      ]
    },
    {
      id: "access_notes",
      question: "Anything important about access, parking or neighbours?",
      type: "textarea",
      required: false,
      placeholder: "Gate codes, no parking, community rules, etc."
    },
    {
      id: "photos",
      question: "Do you have any photos of the area, items or issue?",
      type: "file",
      required: false,
      accept: "image/*"
    }
  ];

  return { microSlug: slug, subcategorySlug, name, questions };
}

/**
 * Detailed pack: General home repairs
 */
const generalHomeRepairsPack: MicroservicePackContent = {
  microSlug: "general-home-repairs",
  subcategorySlug: "general-repairs-maintenance",
  name: "General home repairs",
  questions: [
    {
      id: "repair_types",
      question: "What kinds of repairs do you need?",
      type: "checkbox",
      required: true,
      options: [
        { value: "walls_ceiling", label: "Walls/ceiling (cracks, holes, marks)" },
        { value: "doors_windows", label: "Doors/windows sticking or not closing" },
        { value: "fixtures_loose", label: "Loose fixtures or fittings" },
        { value: "small_leaks", label: "Small leaks / silicone resealing" },
        { value: "other", label: "Other small repairs" }
      ]
    },
    {
      id: "num_locations",
      question: "Is this in one place or several places around the property?",
      type: "select",
      required: true,
      options: [
        { value: "single_area", label: "One room/area" },
        { value: "few_areas", label: "A few rooms/areas" },
        { value: "many_areas", label: "Many small jobs around the property" }
      ]
    },
    {
      id: "decor_impact",
      question: "Is fresh paint or decoration needed after the repairs?",
      type: "radio",
      required: true,
      options: [
        { value: "yes_full", label: "Yes – full repaint of repaired areas" },
        { value: "yes_touchups", label: "Yes – small touch-ups only" },
        { value: "no", label: "No – just repair" },
        { value: "not_sure", label: "Not sure yet" }
      ]
    },
    {
      id: "existing_issues",
      question: "Any underlying issues to be aware of (damp, movement, etc.)?",
      type: "checkbox",
      required: false,
      options: [
        { value: "damp_mould", label: "Damp or mould" },
        { value: "cracks_returning", label: "Cracks that keep coming back" },
        { value: "water_damage", label: "Previous water damage" },
        { value: "none", label: "No obvious underlying issues" }
      ]
    },
    {
      id: "priority",
      question: "What is the priority?",
      type: "select",
      required: true,
      options: [
        { value: "make_safe", label: "Make safe / stop damage getting worse" },
        { value: "finish_neatly", label: "Make it look neat/finished" },
        { value: "both", label: "Both safety and finish" }
      ]
    },
    {
      id: "timeline",
      question: "When would you like the repairs done?",
      type: "select",
      required: true,
      options: [
        { value: "asap", label: "As soon as possible" },
        { value: "this_month", label: "Within this month" },
        { value: "1_3_months", label: "Within 1–3 months" },
        { value: "flexible", label: "Flexible" }
      ]
    }
  ]
};

/**
 * Detailed pack: Furniture assembly
 */
const furnitureAssemblyPack: MicroservicePackContent = {
  microSlug: "furniture-assembly",
  subcategorySlug: "furniture-assembly-installation",
  name: "Furniture assembly",
  questions: [
    {
      id: "items_type",
      question: "What type of furniture needs assembling?",
      type: "checkbox",
      required: true,
      options: [
        { value: "beds", label: "Beds" },
        { value: "wardrobes", label: "Wardrobes" },
        { value: "drawers", label: "Chest of drawers" },
        { value: "tables_chairs", label: "Tables and chairs" },
        { value: "sofas", label: "Sofas / sofa beds" },
        { value: "outdoor", label: "Outdoor furniture" },
        { value: "other", label: "Other flat-pack items" }
      ]
    },
    {
      id: "item_count",
      question: "Roughly how many items in total?",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "1 item" },
        { value: "2_3", label: "2–3 items" },
        { value: "4_6", label: "4–6 items" },
        { value: "7plus", label: "7 or more items" }
      ]
    },
    {
      id: "assembly_location",
      question: "Where will the items be assembled?",
      type: "select",
      required: false,
      options: [
        { value: "same_room", label: "In the room where they'll stay" },
        { value: "elsewhere", label: "Elsewhere then moved into place" },
        { value: "mixed", label: "A mix of both" }
      ]
    },
    {
      id: "flights_of_stairs",
      question: "Are there any stairs, narrow corridors or access issues?",
      type: "select",
      required: false,
      options: [
        { value: "no_issue", label: "No – easy access" },
        { value: "some_stairs", label: "Yes – some stairs" },
        { value: "narrow_access", label: "Yes – narrow access / tight turns" }
      ]
    },
    {
      id: "furniture_supplied",
      question: "Is all furniture already on site and in boxes?",
      type: "radio",
      required: true,
      options: [
        { value: "yes_all", label: "Yes – everything is there" },
        { value: "some", label: "Some is there, more arriving" },
        { value: "no", label: "No – not yet delivered" }
      ]
    },
    {
      id: "old_furniture",
      question: "Do you need help disassembling or moving old furniture?",
      type: "radio",
      required: false,
      options: [
        { value: "yes_disassemble_move", label: "Yes – disassemble and move" },
        { value: "move_only", label: "Move only" },
        { value: "no", label: "No, new items only" }
      ]
    },
    {
      id: "timeline",
      question: "When would you like the furniture assembled?",
      type: "select",
      required: true,
      options: [
        { value: "today_tomorrow", label: "Today / tomorrow if possible" },
        { value: "this_week", label: "This week" },
        { value: "next_week", label: "Next week" },
        { value: "flexible", label: "Flexible" }
      ]
    }
  ]
};

/**
 * Detailed pack: TV wall mounting
 */
const tvWallMountingPack: MicroservicePackContent = {
  microSlug: "tv-wall-mounting",
  subcategorySlug: "mounting-fixtures",
  name: "TV wall mounting",
  questions: [
    {
      id: "tv_sizes",
      question: "What size TV(s) do you want to mount?",
      type: "select",
      required: true,
      options: [
        { value: "up_to_43", label: "Up to 43 inch" },
        { value: "44_55", label: "44–55 inch" },
        { value: "56_65", label: "56–65 inch" },
        { value: "over_65", label: "Over 65 inch" }
      ]
    },
    {
      id: "walls_type",
      question: "What type of wall will the TV be mounted on?",
      type: "select",
      required: false,
      options: [
        { value: "solid", label: "Solid wall (brick/concrete)" },
        { value: "stud", label: "Stud / hollow wall (plasterboard)" },
        { value: "partition_unknown", label: "Partition wall (not sure what's inside)" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "bracket_supplied",
      question: "Do you already have the TV bracket?",
      type: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes, I have a bracket" },
        { value: "no_need_supplied", label: "No – I need one supplied" }
      ]
    },
    {
      id: "cable_concealment",
      question: "How would you like the cables handled?",
      type: "select",
      required: true,
      options: [
        { value: "simple_neaten", label: "Just neatly routed with clips/trunking" },
        { value: "surface_trunking", label: "Surface trunking to hide cables" },
        { value: "in_wall", label: "Chased into wall (may need decorator after)" },
        { value: "not_sure", label: "Not sure – need advice" }
      ]
    },
    {
      id: "devices_connected",
      question: "What devices need connecting to the TV?",
      type: "checkbox",
      required: false,
      options: [
        { value: "tv_box", label: "TV box / satellite" },
        { value: "games_console", label: "Games console" },
        { value: "soundbar", label: "Soundbar / speakers" },
        { value: "other", label: "Other devices" }
      ]
    },
    {
      id: "num_tvs",
      question: "How many TVs need mounting?",
      type: "select",
      required: true,
      options: [
        { value: "1", label: "1 TV" },
        { value: "2", label: "2 TVs" },
        { value: "3plus", label: "3 or more TVs" }
      ]
    },
    {
      id: "timeline",
      question: "When would you like the TV(s) mounted?",
      type: "select",
      required: true,
      options: [
        { value: "asap", label: "As soon as possible" },
        { value: "this_week", label: "This week" },
        { value: "next_week", label: "Next week" },
        { value: "flexible", label: "Flexible" }
      ]
    }
  ]
};

/**
 * Remaining Handyman micro-services → generic pack
 */
const genericHandymanServices: Array<{
  slug: string;
  name: string;
  subcategorySlug: string;
}> = [
  // General Repairs and Maintenance (others)
  { slug: "minor-wall-ceiling-repairs",   name: "Minor wall and ceiling repairs",  subcategorySlug: "general-repairs-maintenance" },
  { slug: "doors-hinges-handles",         name: "Doors, hinges and handles",       subcategorySlug: "general-repairs-maintenance" },
  { slug: "small-leaks-silicone-repairs", name: "Small leaks and silicone repairs",subcategorySlug: "general-repairs-maintenance" },
  { slug: "squeaks-rattles-loose-items",  name: "Squeaks, rattles and loose items",subcategorySlug: "general-repairs-maintenance" },

  // Furniture Assembly and Installation (others)
  { slug: "bed-wardrobe-assembly",        name: "Bed and wardrobe assembly",       subcategorySlug: "furniture-assembly-installation" },
  { slug: "office-furniture-assembly",    name: "Office furniture assembly",       subcategorySlug: "furniture-assembly-installation" },
  { slug: "outdoor-furniture-assembly",   name: "Outdoor furniture assembly",      subcategorySlug: "furniture-assembly-installation" },
  { slug: "furniture-disassembly-reassembly", name: "Furniture disassembly and reassembly", subcategorySlug: "furniture-assembly-installation" },

  // Mounting and Fixtures (others)
  { slug: "shelf-installation",           name: "Shelf installation",              subcategorySlug: "mounting-fixtures" },
  { slug: "curtain-rails-blinds",         name: "Curtain rails and blinds",        subcategorySlug: "mounting-fixtures" },
  { slug: "pictures-mirrors-hanging",     name: "Pictures and mirrors hanging",    subcategorySlug: "mounting-fixtures" },
  { slug: "bathroom-accessories-fitting", name: "Bathroom accessories fitting",    subcategorySlug: "mounting-fixtures" },

  // Small Carpentry and Home Improvements
  { slug: "boxing-in-pipes-cables",       name: "Boxing-in pipes and cables",      subcategorySlug: "small-carpentry-home-improvements" },
  { slug: "skirting-trims-beading",       name: "Skirting, trims and beading",     subcategorySlug: "small-carpentry-home-improvements" },
  { slug: "adjusting-doors-windows",      name: "Adjusting doors and windows",     subcategorySlug: "small-carpentry-home-improvements" },
  { slug: "fitting-locks-latches",        name: "Fitting locks and latches",       subcategorySlug: "small-carpentry-home-improvements" },

  // Odd Jobs and Help
  { slug: "odd-jobs-small-tasks",         name: "Odd jobs and small tasks",        subcategorySlug: "odd-jobs-help" },
  { slug: "help-moving-items-home",       name: "Help moving items in the home",   subcategorySlug: "odd-jobs-help" },
  { slug: "minor-outdoor-garden-jobs",    name: "Minor outdoor and garden jobs",   subcategorySlug: "odd-jobs-help" },
  { slug: "not-sure-need-handyman",       name: "I'm not sure – need a handyman",  subcategorySlug: "odd-jobs-help" }
];

const genericHandymanPacks: MicroservicePackContent[] = genericHandymanServices.map(s =>
  buildGenericHandymanPack(s.slug, s.name, s.subcategorySlug)
);

export const handymanQuestionPacks: MicroservicePackContent[] = [
  generalHomeRepairsPack,
  furnitureAssemblyPack,
  tvWallMountingPack,
  ...genericHandymanPacks
];
