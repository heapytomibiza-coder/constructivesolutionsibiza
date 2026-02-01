/**
 * Construction Question Packs
 * Defines all 41 micro-service question sets for Construction category
 */

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
 * Generic question builder for simpler micro-services
 */
function buildGenericConstructionPack(
  slug: string,
  name: string,
  subcategorySlug: string
): MicroservicePackContent {
  const questions: QuestionDef[] = [
    {
      id: 'description',
      question: `Briefly describe what you need for "${name}".`,
      type: 'textarea',
      required: true,
      placeholder: 'Tell us what you want done, where, and any important details.'
    },
    {
      id: 'area_size',
      question: 'Roughly how big is the area involved?',
      type: 'select',
      required: false,
      options: [
        { value: 'small', label: 'Small area' },
        { value: 'medium', label: 'Medium area' },
        { value: 'large', label: 'Large area' },
        { value: 'whole_property', label: 'Whole property' }
      ]
    },
    {
      id: 'current_state',
      question: 'What is the current state of the area?',
      type: 'select',
      required: false,
      options: [
        { value: 'empty', label: 'Empty / bare' },
        { value: 'part_finished', label: 'Part finished' },
        { value: 'needs_repair', label: 'Needs repair' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the work to be done?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: '1_3_months', label: 'Within 1–3 months' },
        { value: '3_6_months', label: 'Within 3–6 months' },
        { value: 'flexible', label: 'Flexible / just exploring' }
      ]
    },
    {
      id: 'access',
      question: 'How easy is access to the area for workers and materials?',
      type: 'select',
      required: false,
      options: [
        { value: 'easy', label: 'Easy – direct access' },
        { value: 'moderate', label: 'Moderate – some restrictions' },
        { value: 'difficult', label: 'Difficult – narrow or limited access' }
      ]
    },
    {
      id: 'photos',
      question: 'Do you have any photos or plans to upload?',
      type: 'file',
      required: false,
      accept: 'image/*,application/pdf'
    }
  ];

  return { microSlug: slug, subcategorySlug, name, questions };
}

// ========== HAND-CRAFTED QUESTION PACKS ==========

const newFoundationsPack: MicroservicePackContent = {
  microSlug: 'new-foundations',
  subcategorySlug: 'foundation-work',
  name: 'New foundations',
  questions: [
    {
      id: 'area_size',
      question: 'What is the total area for the foundation?',
      type: 'select',
      required: true,
      options: [
        { value: 'under_50', label: 'Under 50 m²' },
        { value: '50_100', label: '50–100 m²' },
        { value: '100_200', label: '100–200 m²' },
        { value: 'over_200', label: 'Over 200 m²' }
      ]
    },
    {
      id: 'soil_type',
      question: 'Do you know what type of ground/soil is present?',
      type: 'select',
      required: true,
      options: [
        { value: 'stable', label: 'Stable soil' },
        { value: 'clay', label: 'Clay soil' },
        { value: 'sandy', label: 'Sandy soil' },
        { value: 'rocky', label: 'Rocky terrain' },
        { value: 'unknown', label: 'Not sure' }
      ]
    },
    {
      id: 'depth_required',
      question: 'Do you know the depth required for the foundations?',
      type: 'radio',
      required: true,
      options: [
        { value: 'shallow', label: 'Shallow (under 1m)' },
        { value: 'medium', label: '1–2m' },
        { value: 'deep', label: 'Over 2m' },
        { value: 'unknown', label: 'Not sure – need advice' }
      ]
    },
    {
      id: 'existing_structures',
      question: 'Are there existing structures or services nearby?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'buildings', label: 'Adjacent buildings' },
        { value: 'utilities', label: 'Underground utilities' },
        { value: 'trees', label: 'Trees / large roots' },
        { value: 'none', label: 'None of these' }
      ]
    },
    {
      id: 'access_difficulty',
      question: 'How is access for heavy machinery?',
      type: 'select',
      required: true,
      options: [
        { value: 'easy', label: 'Easy – trucks and diggers can access directly' },
        { value: 'moderate', label: 'Moderate – some restrictions' },
        { value: 'difficult', label: 'Difficult – narrow access, may need smaller equipment' },
        { value: 'manual', label: 'Very difficult – mostly manual work' }
      ]
    },
    {
      id: 'drainage_needed',
      question: 'Will drainage or waterproofing be needed around the foundations?',
      type: 'radio',
      required: true,
      options: [
        { value: 'full', label: 'Yes, a full drainage system' },
        { value: 'partial', label: 'Yes, partial drainage' },
        { value: 'none', label: 'No drainage needed' },
        { value: 'unsure', label: 'Not sure – need advice' }
      ]
    },
    {
      id: 'timeline',
      question: 'When do you need the foundation work completed?',
      type: 'select',
      required: true,
      options: [
        { value: '2_weeks', label: 'Within 2 weeks' },
        { value: '2_4_weeks', label: '2–4 weeks' },
        { value: '1_3_months', label: '1–3 months' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

const homeExtensionSingleFloorPack: MicroservicePackContent = {
  microSlug: 'home-extension-single-floor',
  subcategorySlug: 'extensions',
  name: 'Home extensions (single floor)',
  questions: [
    {
      id: 'extension_size',
      question: 'What size extension are you planning?',
      type: 'select',
      required: true,
      options: [
        { value: 'under_20', label: 'Small (under 20 m²)' },
        { value: '20_40', label: 'Medium (20–40 m²)' },
        { value: '40_60', label: 'Large (40–60 m²)' },
        { value: 'over_60', label: 'Very large (over 60 m²)' }
      ]
    },
    {
      id: 'extension_purpose',
      question: 'What will the extension be used for?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'bedroom', label: 'Extra bedroom' },
        { value: 'kitchen', label: 'Kitchen extension' },
        { value: 'living_space', label: 'Living space' },
        { value: 'office', label: 'Home office' },
        { value: 'bathroom', label: 'Bathroom' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'existing_plans',
      question: 'Do you already have architectural plans?',
      type: 'radio',
      required: true,
      options: [
        { value: 'approved', label: 'Yes, approved by authorities' },
        { value: 'not_approved', label: 'Yes, but not yet approved' },
        { value: 'need_architect', label: 'No, I need an architect' },
        { value: 'in_progress', label: 'In progress' }
      ]
    },
    {
      id: 'roof_type',
      question: 'What type of roof do you want on the extension?',
      type: 'select',
      required: false,
      options: [
        { value: 'flat', label: 'Flat roof' },
        { value: 'pitched_match', label: 'Pitched – match existing' },
        { value: 'pitched_other', label: 'Pitched – different style' },
        { value: 'glass', label: 'Glass / conservatory style' },
        { value: 'undecided', label: 'Not decided yet' }
      ]
    },
    {
      id: 'finish_level',
      question: 'What level of finish are you looking for?',
      type: 'radio',
      required: true,
      options: [
        { value: 'shell', label: 'Shell only (structure, roof, windows)' },
        { value: 'first_fix', label: 'First fix (plastering, basic electrics/plumbing)' },
        { value: 'turnkey', label: 'Full finish (ready to move in)' },
        { value: 'unsure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'budget_range',
      question: 'What is your approximate budget?',
      type: 'select',
      required: true,
      options: [
        { value: 'under_30k', label: 'Under €30k' },
        { value: '30_50k', label: '€30k–€50k' },
        { value: '50_80k', label: '€50k–€80k' },
        { value: '80_120k', label: '€80k–€120k' },
        { value: 'over_120k', label: 'Over €120k' }
      ]
    },
    {
      id: 'start_timeline',
      question: 'When would you like to start?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'ASAP' },
        { value: '1_3_months', label: '1–3 months' },
        { value: '3_6_months', label: '3–6 months' },
        { value: '6_plus', label: '6+ months' },
        { value: 'exploring', label: 'Just exploring options' }
      ]
    }
  ]
};

const roofRepairsPack: MicroservicePackContent = {
  microSlug: 'roof-repairs',
  subcategorySlug: 'roofing',
  name: 'Roof repairs',
  questions: [
    {
      id: 'problem_type',
      question: 'What is the main roofing issue?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'leaks', label: 'Leaks / water damage' },
        { value: 'missing_tiles', label: 'Missing or broken tiles' },
        { value: 'flashing', label: 'Damaged flashing' },
        { value: 'sagging', label: 'Sagging roof' },
        { value: 'storm', label: 'Storm damage' },
        { value: 'age', label: 'Age-related wear' }
      ]
    },
    {
      id: 'affected_area',
      question: 'How large is the affected area?',
      type: 'select',
      required: true,
      options: [
        { value: 'small', label: 'Small area (a few tiles)' },
        { value: 'medium', label: 'Medium section (up to 10 m²)' },
        { value: 'large', label: 'Large section (10–30 m²)' },
        { value: 'most_roof', label: 'Most or all of the roof' }
      ]
    },
    {
      id: 'roof_type',
      question: 'What type of roof do you have?',
      type: 'select',
      required: true,
      options: [
        { value: 'tile', label: 'Clay or concrete tiles' },
        { value: 'slate', label: 'Slate' },
        { value: 'flat', label: 'Flat roof (bitumen / membrane)' },
        { value: 'metal', label: 'Metal roof' },
        { value: 'unknown', label: 'Not sure' }
      ]
    },
    {
      id: 'urgency',
      question: 'How urgent is the repair?',
      type: 'radio',
      required: true,
      options: [
        { value: 'emergency', label: 'Emergency – active leak' },
        { value: 'very_urgent', label: 'Very urgent – within a few days' },
        { value: 'soon', label: 'Soon – within 2 weeks' },
        { value: 'can_wait', label: 'Can wait – within a month' }
      ]
    },
    {
      id: 'access_type',
      question: 'How high is the roof / what access is needed?',
      type: 'select',
      required: true,
      options: [
        { value: 'single_story', label: 'Single storey' },
        { value: 'two_story', label: 'Two storey' },
        { value: 'three_plus', label: 'Three storey or higher' },
        { value: 'difficult', label: 'Difficult access – likely need scaffolding' }
      ]
    },
    {
      id: 'matching_materials',
      question: 'Do the new materials need to match the existing ones?',
      type: 'radio',
      required: false,
      options: [
        { value: 'exact', label: 'Yes, exact match' },
        { value: 'similar', label: 'Similar is fine' },
        { value: 'different', label: 'Can be different' },
        { value: 'replace_section', label: 'Replace entire section' }
      ]
    }
  ]
};

// ========== GENERIC PACKS FOR REMAINING 38 MICRO-SERVICES ==========

const genericMicroServices: Array<{ slug: string; name: string; subcategorySlug: string }> = [
  // Foundation Work (4 more)
  { slug: 'concrete-base-preparation', name: 'Concrete base preparation', subcategorySlug: 'foundation-work' },
  { slug: 'levelling-uneven-ground', name: 'Leveling uneven ground', subcategorySlug: 'foundation-work' },
  { slug: 'retaining-walls', name: 'Retaining walls', subcategorySlug: 'foundation-work' },
  { slug: 'foundation-drainage', name: 'Drainage around foundations', subcategorySlug: 'foundation-work' },

  // Structural Repairs (5)
  { slug: 'repairing-large-cracks', name: 'Repairing large cracks', subcategorySlug: 'structural-repairs' },
  { slug: 'wall-strengthening', name: 'Wall strengthening', subcategorySlug: 'structural-repairs' },
  { slug: 'fixing-movement-or-sinking', name: 'Fixing movement or sinking', subcategorySlug: 'structural-repairs' },
  { slug: 'replacing-structural-elements', name: 'Replacing damaged structural elements', subcategorySlug: 'structural-repairs' },
  { slug: 'safe-wall-removal-openings', name: 'Safe wall removal / openings', subcategorySlug: 'structural-repairs' },

  // Extensions (5 more)
  { slug: 'home-extension-two-floors', name: 'Home extensions (two floors)', subcategorySlug: 'extensions' },
  { slug: 'adding-new-rooms', name: 'Adding new rooms', subcategorySlug: 'extensions' },
  { slug: 'garage-conversions', name: 'Garage conversions', subcategorySlug: 'extensions' },
  { slug: 'terrace-rooftop-extensions', name: 'Terrace or rooftop extensions', subcategorySlug: 'extensions' },
  { slug: 'conservatories-glass-rooms', name: 'Conservatories / glass rooms', subcategorySlug: 'extensions' },

  // Brickwork, Masonry & Concrete (5)
  { slug: 'building-repairing-walls', name: 'Building or repairing walls', subcategorySlug: 'brickwork-masonry-concrete' },
  { slug: 'garden-boundary-walls', name: 'Garden / boundary walls', subcategorySlug: 'brickwork-masonry-concrete' },
  { slug: 'concrete-bases-paths-floors', name: 'Concrete bases, paths & floors', subcategorySlug: 'brickwork-masonry-concrete' },
  { slug: 'stone-brick-restoration', name: 'Stone or brick restoration', subcategorySlug: 'brickwork-masonry-concrete' },
  { slug: 'rendering-exterior-finishing', name: 'Rendering & exterior finishing', subcategorySlug: 'brickwork-masonry-concrete' },

  // Roofing (4 more)
  { slug: 'new-roof-installation', name: 'New roof installation', subcategorySlug: 'roofing' },
  { slug: 'flat-roofs', name: 'Flat roofs', subcategorySlug: 'roofing' },
  { slug: 'roof-waterproofing', name: 'Waterproofing', subcategorySlug: 'roofing' },
  { slug: 'guttering-drainage', name: 'Guttering & drainage', subcategorySlug: 'roofing' },

  // Tiling & Waterproofing (5)
  { slug: 'floor-tiling', name: 'Floor tiling', subcategorySlug: 'tiling-waterproofing' },
  { slug: 'wall-tiling', name: 'Wall tiling', subcategorySlug: 'tiling-waterproofing' },
  { slug: 'terrace-waterproofing', name: 'Terrace waterproofing', subcategorySlug: 'tiling-waterproofing' },
  { slug: 'regrouting-resealing', name: 'Re-grouting & re-sealing', subcategorySlug: 'tiling-waterproofing' },
  { slug: 'shower-wetroom-tiling', name: 'Shower & wetroom tiling', subcategorySlug: 'tiling-waterproofing' },

  // Outdoor Construction (5)
  { slug: 'terraces-patios', name: 'Terraces & patios', subcategorySlug: 'outdoor-construction' },
  { slug: 'outdoor-kitchens', name: 'Outdoor kitchens', subcategorySlug: 'outdoor-construction' },
  { slug: 'pergolas-gazebos', name: 'Pergolas & gazebos', subcategorySlug: 'outdoor-construction' },
  { slug: 'fencing-boundary-structures', name: 'Fencing & boundary structures', subcategorySlug: 'outdoor-construction' },
  { slug: 'driveways-pathways', name: 'Driveways & pathways', subcategorySlug: 'outdoor-construction' },

  // Renovations & Home Upgrades (5)
  { slug: 'full-home-renovation', name: 'Full home renovation', subcategorySlug: 'renovations-home-upgrades' },
  { slug: 'partial-renovation', name: 'Partial renovation', subcategorySlug: 'renovations-home-upgrades' },
  { slug: 'open-plan-conversions', name: 'Open-plan conversions', subcategorySlug: 'renovations-home-upgrades' },
  { slug: 'layout-changes', name: 'Layout changes', subcategorySlug: 'renovations-home-upgrades' },
  { slug: 'modernisation-upgrades', name: 'Modernisation & upgrades', subcategorySlug: 'renovations-home-upgrades' }
];

const genericPacks: MicroservicePackContent[] = genericMicroServices.map(s =>
  buildGenericConstructionPack(s.slug, s.name, s.subcategorySlug)
);

// ========== EXPORT ALL 41 PACKS ==========

export const constructionQuestionPacks: MicroservicePackContent[] = [
  newFoundationsPack,
  homeExtensionSingleFloorPack,
  roofRepairsPack,
  ...genericPacks
];
