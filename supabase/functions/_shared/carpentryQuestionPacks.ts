/**
 * Carpentry Question Packs
 * Defines all 15 micro-service question sets for Carpentry category
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
 * Generic question builder for simpler micro-services
 */
function buildGenericCarpentryPack(
  slug: string,
  name: string,
  subcategorySlug: string
): MicroservicePackContent {
  const questions: QuestionDef[] = [
    {
      id: 'description',
      question: `Please describe what you need for "${name}".`,
      type: 'textarea',
      required: true,
      placeholder: 'Tell us about the style, dimensions, wood type, and any special requirements.'
    },
    {
      id: 'room_location',
      question: 'Which room or area is this for?',
      type: 'select',
      required: true,
      options: [
        { value: 'bedroom', label: 'Bedroom' },
        { value: 'living_room', label: 'Living room' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bathroom', label: 'Bathroom' },
        { value: 'hallway', label: 'Hallway / entrance' },
        { value: 'office', label: 'Home office' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'style_preference',
      question: 'What style are you looking for?',
      type: 'select',
      required: false,
      options: [
        { value: 'modern', label: 'Modern / contemporary' },
        { value: 'traditional', label: 'Traditional / classic' },
        { value: 'rustic', label: 'Rustic / farmhouse' },
        { value: 'minimalist', label: 'Minimalist / Scandinavian' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'match_existing', label: 'Match existing furniture' }
      ]
    },
    {
      id: 'wood_type',
      question: 'Do you have a wood type preference?',
      type: 'select',
      required: false,
      options: [
        { value: 'oak', label: 'Oak' },
        { value: 'pine', label: 'Pine' },
        { value: 'walnut', label: 'Walnut' },
        { value: 'mdf_painted', label: 'MDF (painted finish)' },
        { value: 'plywood', label: 'Plywood' },
        { value: 'not_sure', label: 'Not sure - need advice' }
      ]
    },
    {
      id: 'measurements_available',
      question: 'Do you have measurements?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes_exact', label: 'Yes, I have exact measurements' },
        { value: 'approximate', label: 'I have approximate measurements' },
        { value: 'need_measure', label: 'No, need carpenter to measure' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like this completed?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: '2_4_weeks', label: '2–4 weeks' },
        { value: '1_2_months', label: '1–2 months' },
        { value: 'flexible', label: 'Flexible / just exploring' }
      ]
    },
    {
      id: 'photos',
      question: 'Any photos, sketches, or inspiration images?',
      type: 'file',
      required: false,
      accept: 'image/*,application/pdf'
    }
  ];

  return { microSlug: slug, subcategorySlug, name, questions };
}

// ========== HAND-CRAFTED QUESTION PACKS ==========

// 1) Custom Furniture → Bespoke tables
const bespokeTablesPack: MicroservicePackContent = {
  microSlug: 'bespoke-tables',
  subcategorySlug: 'custom-furniture',
  name: 'Bespoke tables',
  questions: [
    {
      id: 'table_type',
      question: 'What type of table do you need?',
      type: 'select',
      required: true,
      options: [
        { value: 'dining', label: 'Dining table' },
        { value: 'coffee', label: 'Coffee table' },
        { value: 'console', label: 'Console / hallway table' },
        { value: 'desk', label: 'Desk / work table' },
        { value: 'side', label: 'Side table / occasional table' }
      ]
    },
    {
      id: 'seating_capacity',
      question: 'How many people should it seat? (if dining table)',
      type: 'select',
      required: false,
      options: [
        { value: '2_4', label: '2–4 people' },
        { value: '4_6', label: '4–6 people' },
        { value: '6_8', label: '6–8 people' },
        { value: '8_plus', label: '8+ people' }
      ],
      dependsOn: {
        questionId: 'table_type',
        value: 'dining'
      }
    },
    {
      id: 'table_shape',
      question: 'What shape would you like?',
      type: 'select',
      required: true,
      options: [
        { value: 'rectangular', label: 'Rectangular' },
        { value: 'square', label: 'Square' },
        { value: 'round', label: 'Round' },
        { value: 'oval', label: 'Oval' },
        { value: 'custom', label: 'Custom shape' }
      ]
    },
    {
      id: 'size_specs',
      question: 'Do you have specific size requirements?',
      type: 'textarea',
      required: false,
      placeholder: 'e.g., Must fit in 2m x 1m space, or specific dimensions needed'
    },
    {
      id: 'wood_finish',
      question: 'What finish would you like?',
      type: 'select',
      required: true,
      options: [
        { value: 'natural_oil', label: 'Natural wood with oil finish' },
        { value: 'stained', label: 'Stained wood' },
        { value: 'painted', label: 'Painted finish' },
        { value: 'lacquered', label: 'Lacquered / varnished' },
        { value: 'not_sure', label: 'Not sure - need advice' }
      ]
    },
    {
      id: 'special_features',
      question: 'Any special features needed?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'extending', label: 'Extending / extendable table' },
        { value: 'drawers', label: 'Built-in drawers or storage' },
        { value: 'wheels', label: 'Wheels or casters' },
        { value: 'metal_legs', label: 'Metal legs / frame' },
        { value: 'none', label: 'No special features' }
      ]
    },
    {
      id: 'budget_range',
      question: 'What is your approximate budget?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_500', label: 'Under €500' },
        { value: '500_1000', label: '€500–€1,000' },
        { value: '1000_2000', label: '€1,000–€2,000' },
        { value: '2000_plus', label: 'Over €2,000' },
        { value: 'flexible', label: 'Flexible - quality is priority' }
      ]
    }
  ]
};

// 2) Fitted Wardrobes → Sliding door wardrobes
const slidingDoorWardrobesPack: MicroservicePackContent = {
  microSlug: 'sliding-door-wardrobes',
  subcategorySlug: 'fitted-wardrobes',
  name: 'Sliding door wardrobes',
  questions: [
    {
      id: 'wardrobe_width',
      question: 'Approximately how wide is the space?',
      type: 'select',
      required: true,
      options: [
        { value: 'under_2m', label: 'Under 2m' },
        { value: '2_3m', label: '2–3m' },
        { value: '3_4m', label: '3–4m' },
        { value: 'over_4m', label: 'Over 4m (full wall)' }
      ]
    },
    {
      id: 'wardrobe_height',
      question: 'What height wardrobe do you need?',
      type: 'select',
      required: true,
      options: [
        { value: 'standard', label: 'Standard height (~2.4m)' },
        { value: 'floor_to_ceiling', label: 'Floor to ceiling (full height)' },
        { value: 'custom', label: 'Custom height needed' }
      ]
    },
    {
      id: 'door_panels',
      question: 'How many sliding door panels?',
      type: 'select',
      required: true,
      options: [
        { value: '2_panel', label: '2 panels' },
        { value: '3_panel', label: '3 panels' },
        { value: '4_panel', label: '4 panels' },
        { value: 'not_sure', label: 'Not sure - need advice' }
      ]
    },
    {
      id: 'door_finish',
      question: 'What door finish would you like?',
      type: 'select',
      required: true,
      options: [
        { value: 'mirror', label: 'Mirror doors' },
        { value: 'glass', label: 'Glass (frosted/clear)' },
        { value: 'wood_effect', label: 'Wood effect' },
        { value: 'painted', label: 'Painted finish' },
        { value: 'mixed', label: 'Mixed (e.g., mirror + wood)' }
      ]
    },
    {
      id: 'internal_layout',
      question: 'What internal layout do you need?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'hanging_rail', label: 'Hanging rails' },
        { value: 'shelves', label: 'Shelving' },
        { value: 'drawers', label: 'Internal drawers' },
        { value: 'shoe_rack', label: 'Shoe storage' },
        { value: 'not_sure', label: 'Not sure - need design advice' }
      ]
    },
    {
      id: 'room_type',
      question: 'Which room is this for?',
      type: 'select',
      required: true,
      options: [
        { value: 'master_bedroom', label: 'Master bedroom' },
        { value: 'bedroom', label: 'Bedroom' },
        { value: 'dressing_room', label: 'Dressing room' },
        { value: 'hallway', label: 'Hallway / entrance' }
      ]
    },
    {
      id: 'installation_timeline',
      question: 'When do you need this installed?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'ASAP' },
        { value: '2_4_weeks', label: '2–4 weeks' },
        { value: '1_2_months', label: '1–2 months' },
        { value: 'flexible', label: 'Flexible timing' }
      ]
    }
  ]
};

// 3) Bespoke Joinery → Staircases & handrails
const staircasesHandrailsPack: MicroservicePackContent = {
  microSlug: 'staircases-handrails',
  subcategorySlug: 'bespoke-joinery',
  name: 'Staircases & handrails',
  questions: [
    {
      id: 'project_type',
      question: 'What type of project is this?',
      type: 'select',
      required: true,
      options: [
        { value: 'new_staircase', label: 'New staircase installation' },
        { value: 'replace_staircase', label: 'Replace existing staircase' },
        { value: 'handrails_only', label: 'Handrails / balustrade only' },
        { value: 'repair', label: 'Repair existing staircase' },
        { value: 'modernize', label: 'Modernize / update existing' }
      ]
    },
    {
      id: 'staircase_type',
      question: 'What type of staircase?',
      type: 'select',
      required: true,
      options: [
        { value: 'straight', label: 'Straight staircase' },
        { value: 'l_shaped', label: 'L-shaped (quarter turn)' },
        { value: 'u_shaped', label: 'U-shaped (half turn)' },
        { value: 'spiral', label: 'Spiral / curved' },
        { value: 'not_sure', label: 'Not sure - need design advice' }
      ]
    },
    {
      id: 'step_count',
      question: 'Approximately how many steps?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_10', label: 'Under 10 steps' },
        { value: '10_15', label: '10–15 steps' },
        { value: 'over_15', label: 'Over 15 steps' },
        { value: 'not_counted', label: 'Haven\'t counted yet' }
      ]
    },
    {
      id: 'material_preference',
      question: 'What materials would you like?',
      type: 'select',
      required: true,
      options: [
        { value: 'solid_wood', label: 'Solid wood (oak, pine, etc.)' },
        { value: 'engineered_wood', label: 'Engineered wood' },
        { value: 'metal_wood', label: 'Metal and wood combination' },
        { value: 'glass_balustrade', label: 'Glass balustrade' },
        { value: 'not_sure', label: 'Not sure - need advice' }
      ]
    },
    {
      id: 'handrail_style',
      question: 'What handrail style do you prefer?',
      type: 'select',
      required: true,
      options: [
        { value: 'traditional', label: 'Traditional wooden rails and spindles' },
        { value: 'modern_glass', label: 'Modern glass panels' },
        { value: 'metal_cable', label: 'Metal with cable infill' },
        { value: 'open_tread', label: 'Open tread (minimal balustrade)' },
        { value: 'match_existing', label: 'Match existing style' }
      ]
    },
    {
      id: 'building_regs',
      question: 'Are you aware if building regulations apply?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes_compliant', label: 'Yes, needs to meet building regs' },
        { value: 'domestic', label: 'Domestic property - assume standard regs' },
        { value: 'not_sure', label: 'Not sure - need guidance' }
      ]
    },
    {
      id: 'access_difficulty',
      question: 'How easy is access to the work area?',
      type: 'select',
      required: false,
      options: [
        { value: 'easy', label: 'Easy access' },
        { value: 'moderate', label: 'Some restrictions (narrow doorways, etc.)' },
        { value: 'difficult', label: 'Difficult - tight space or upper floor' }
      ]
    }
  ]
};

// ========== GENERIC PACKS FOR REMAINING 12 MICRO-SERVICES ==========

const genericMicroServices: Array<{ slug: string; name: string; subcategorySlug: string }> = [
  // Custom Furniture (4 more)
  { slug: 'shelving-storage-units', name: 'Shelving & storage units', subcategorySlug: 'custom-furniture' },
  { slug: 'tv-media-units', name: 'TV & media units', subcategorySlug: 'custom-furniture' },
  { slug: 'beds-headboards', name: 'Beds & headboards', subcategorySlug: 'custom-furniture' },
  { slug: 'built-in-benches-seating', name: 'Built-in benches & seating', subcategorySlug: 'custom-furniture' },

  // Fitted Wardrobes (4 more)
  { slug: 'hinged-door-wardrobes', name: 'Hinged door wardrobes', subcategorySlug: 'fitted-wardrobes' },
  { slug: 'walk-in-wardrobes', name: 'Walk-in wardrobes', subcategorySlug: 'fitted-wardrobes' },
  { slug: 'under-stair-storage', name: 'Under-stair storage', subcategorySlug: 'fitted-wardrobes' },
  { slug: 'built-in-cupboards', name: 'Built-in cupboards', subcategorySlug: 'fitted-wardrobes' },

  // Bespoke Joinery (4 more)
  { slug: 'doors-frames', name: 'Doors & frames', subcategorySlug: 'bespoke-joinery' },
  { slug: 'window-frames-seats', name: 'Window frames & seats', subcategorySlug: 'bespoke-joinery' },
  { slug: 'skirting-architraves', name: 'Skirting & architraves', subcategorySlug: 'bespoke-joinery' },
  { slug: 'custom-cabinetry', name: 'Custom cabinetry', subcategorySlug: 'bespoke-joinery' }
];

const genericPacks: MicroservicePackContent[] = genericMicroServices.map(s =>
  buildGenericCarpentryPack(s.slug, s.name, s.subcategorySlug)
);

// ========== EXPORT ALL 15 PACKS ==========

export const carpentryQuestionPacks: MicroservicePackContent[] = [
  bespokeTablesPack,
  slidingDoorWardrobesPack,
  staircasesHandrailsPack,
  ...genericPacks
];
