/**
 * Kitchen & Bathroom Question Packs
 * Defines all micro-service question sets for Kitchen & Bathroom category
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
 * Generic Kitchen & Bathroom pack
 */
function buildGenericKitchenBathroomPack(
  slug: string,
  name: string,
  subcategorySlug: string
): MicroservicePackContent {
  const questions: QuestionDef[] = [
    {
      id: 'job_description',
      question: `Briefly describe what you need for "${name}".`,
      type: 'textarea',
      required: true,
      placeholder: 'Is this a new install, upgrade, or small change? Which room and what needs doing?'
    },
    {
      id: 'property_type',
      question: 'What type of property is it?',
      type: 'select',
      required: true,
      options: [
        { value: 'apartment', label: 'Apartment' },
        { value: 'house', label: 'House' },
        { value: 'villa', label: 'Villa' },
        { value: 'commercial', label: 'Commercial property' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'room_type',
      question: 'Which room is this for?',
      type: 'select',
      required: true,
      options: [
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'main_bathroom', label: 'Main bathroom' },
        { value: 'ensuite', label: 'Ensuite' },
        { value: 'cloakroom', label: 'Cloakroom / WC' },
        { value: 'utility', label: 'Utility / laundry room' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'existing_or_new',
      question: 'Is this a completely new room or updating an existing one?',
      type: 'radio',
      required: true,
      options: [
        { value: 'updating_existing', label: 'Updating an existing room' },
        { value: 'new_room', label: 'New room (or change of use)' },
        { value: 'not_sure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'other_trades',
      question: 'Do you also need other trades as part of this job?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'plumbing', label: 'Plumbing' },
        { value: 'electrical', label: 'Electrics / lighting' },
        { value: 'tiling', label: 'Tiling' },
        { value: 'plastering', label: 'Plastering / ceilings' },
        { value: 'painting', label: 'Painting / decorating' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the work to start?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: '1_2_months', label: 'Within 1–2 months' },
        { value: '3_6_months', label: 'Within 3–6 months' },
        { value: 'flexible', label: 'Flexible / just planning' }
      ]
    },
    {
      id: 'photos',
      question: 'Do you have any photos or plans you can share?',
      type: 'file',
      required: false,
      accept: 'image/*,application/pdf'
    }
  ];

  return { microSlug: slug, name, subcategorySlug, questions };
}

/**
 * Detailed pack: Kitchen fitting
 */
const kitchenFittingPack: MicroservicePackContent = {
  microSlug: 'kitchen-fitting',
  name: 'Kitchen fitting',
  subcategorySlug: 'kitchen-fitting-renovation',
  questions: [
    {
      id: 'kitchen_job_type',
      question: 'What type of kitchen job is this?',
      type: 'select',
      required: true,
      options: [
        { value: 'full_new', label: 'Full new kitchen installation' },
        { value: 'replace_units', label: 'Replacing units and worktops' },
        { value: 'replace_doors', label: 'Replacing doors/handles only' },
        { value: 'partial_update', label: 'Partial update / small changes' }
      ]
    },
    {
      id: 'plans_and_layout',
      question: 'Do you already have a layout or plans?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes_final', label: 'Yes – final plans from a supplier' },
        { value: 'yes_rough', label: 'Rough layout only' },
        { value: 'no_need_help', label: 'No – need help with layout/design' }
      ]
    },
    {
      id: 'units_worktops_supplied',
      question: 'Who will supply the kitchen units and worktops?',
      type: 'radio',
      required: true,
      options: [
        { value: 'client_supplies', label: 'I will supply units/worktops' },
        { value: 'installer_supplies', label: 'I\'d like the installer to supply them' },
        { value: 'mixed', label: 'A mix of both' }
      ]
    },
    {
      id: 'appliances',
      question: 'Which appliances need fitting or moving?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'oven_hob', label: 'Oven / hob' },
        { value: 'extractor', label: 'Extractor / hood' },
        { value: 'fridge_freezer', label: 'Fridge / freezer' },
        { value: 'dishwasher', label: 'Dishwasher' },
        { value: 'washing_machine', label: 'Washing machine' },
        { value: 'other', label: 'Other appliances' }
      ]
    },
    {
      id: 'services_changes',
      question: 'Will plumbing or electrics need moving or adding?',
      type: 'select',
      required: true,
      options: [
        { value: 'use_existing', label: 'Use existing positions' },
        { value: 'move_some', label: 'Move some services' },
        { value: 'full_relayout', label: 'Full relayout of services' },
        { value: 'not_sure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'current_stage',
      question: 'What stage are you at now?',
      type: 'select',
      required: true,
      options: [
        { value: 'planning', label: 'Just planning / getting quotes' },
        { value: 'ordered_kitchen', label: 'Kitchen ordered, need fitting' },
        { value: 'old_kitchen_removed', label: 'Old kitchen removed' },
        { value: 'existing_in_place', label: 'Existing kitchen still in place' }
      ]
    },
    {
      id: 'timeline',
      question: 'When do you need the kitchen work done by?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: 'this_month', label: 'Within this month' },
        { value: '1_3_months', label: 'Within 1–3 months' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

/**
 * Detailed pack: Bathroom design
 */
const bathroomDesignPack: MicroservicePackContent = {
  microSlug: 'bathroom-design',
  name: 'Bathroom design',
  subcategorySlug: 'bathroom-fitting-renovation',
  questions: [
    {
      id: 'bathroom_job_type',
      question: 'What are you looking to do?',
      type: 'select',
      required: true,
      options: [
        { value: 'full_new', label: 'Design and install a full new bathroom' },
        { value: 'refurbish', label: 'Refurbish/upgrade an existing bathroom' },
        { value: 'ensuite_cloakroom', label: 'Design a small ensuite / cloakroom' }
      ]
    },
    {
      id: 'bathroom_size',
      question: 'Rough bathroom size (if known)?',
      type: 'select',
      required: false,
      options: [
        { value: 'very_small', label: 'Very small (cloakroom)' },
        { value: 'small', label: 'Small bathroom' },
        { value: 'medium', label: 'Medium bathroom' },
        { value: 'large', label: 'Large bathroom' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'fixtures_required',
      question: 'Which items should be included in the design?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'toilet', label: 'Toilet' },
        { value: 'basin', label: 'Basin / vanity unit' },
        { value: 'shower', label: 'Shower' },
        { value: 'bath', label: 'Bath' },
        { value: 'storage', label: 'Storage / units' },
        { value: 'heating', label: 'Towel rail / heating' }
      ]
    },
    {
      id: 'style_preference',
      question: 'What style do you prefer?',
      type: 'select',
      required: false,
      options: [
        { value: 'modern', label: 'Modern / minimal' },
        { value: 'classic', label: 'Classic / traditional' },
        { value: 'spa', label: 'Spa / hotel style' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'open_to_ideas', label: 'Open to ideas' }
      ]
    },
    {
      id: 'supply_sanitaryware',
      question: 'Who will supply tiles, sanitaryware and fittings?',
      type: 'radio',
      required: true,
      options: [
        { value: 'client', label: 'I will supply everything' },
        { value: 'designer_installer', label: 'Designer/installer to supply' },
        { value: 'mixed', label: 'A mix of both' }
      ]
    },
    {
      id: 'current_issues',
      question: 'Any current issues that must be solved?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'leaks', label: 'Leaks / damp' },
        { value: 'poor_layout', label: 'Poor layout' },
        { value: 'storage', label: 'Not enough storage' },
        { value: 'old_style', label: 'Very dated style' },
        { value: 'cold_bathroom', label: 'Cold / badly heated room' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the design/installation to happen?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: '1_3_months', label: 'Within 1–3 months' },
        { value: '3_6_months', label: 'Within 3–6 months' },
        { value: 'flexible', label: 'Flexible / early planning' }
      ]
    }
  ]
};

/**
 * Detailed pack: Wetroom installation
 */
const wetroomInstallationPack: MicroservicePackContent = {
  microSlug: 'wetroom-installation',
  name: 'Wetroom installation',
  subcategorySlug: 'wetrooms-specialist-bathrooms',
  questions: [
    {
      id: 'wetroom_location',
      question: 'Where will the wetroom be?',
      type: 'select',
      required: true,
      options: [
        { value: 'main_bathroom', label: 'Main bathroom' },
        { value: 'ensuite', label: 'Ensuite' },
        { value: 'loft_basement', label: 'Loft / basement' },
        { value: 'other', label: 'Other location' }
      ]
    },
    {
      id: 'floor_type',
      question: 'What type of floor structure do you have?',
      type: 'select',
      required: false,
      options: [
        { value: 'concrete', label: 'Concrete' },
        { value: 'timber', label: 'Timber / wooden floor' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'existing_or_new',
      question: 'Is this converting an existing bathroom or completely new?',
      type: 'radio',
      required: true,
      options: [
        { value: 'convert_existing', label: 'Convert existing bathroom' },
        { value: 'new_room', label: 'Create a new wetroom' }
      ]
    },
    {
      id: 'fixtures',
      question: 'What fixtures will the wetroom include?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'shower', label: 'Shower area' },
        { value: 'toilet', label: 'Toilet' },
        { value: 'basin', label: 'Basin / vanity' },
        { value: 'bench', label: 'Built-in bench/seating' },
        { value: 'storage', label: 'Storage niches/shelves' }
      ]
    },
    {
      id: 'accessibility',
      question: 'Is this wetroom for improved accessibility?',
      type: 'radio',
      required: false,
      options: [
        { value: 'yes', label: 'Yes – needs wheelchair / mobility access' },
        { value: 'no', label: 'No – not specifically' }
      ]
    },
    {
      id: 'tiling_and_finishes',
      question: 'Do you already have tiles and finishes chosen?',
      type: 'select',
      required: false,
      options: [
        { value: 'all_chosen', label: 'Yes – everything is chosen' },
        { value: 'some_chosen', label: 'Some chosen, some still to decide' },
        { value: 'need_help', label: 'No – need help choosing' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the wetroom work done?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: '1_3_months', label: 'Within 1–3 months' },
        { value: '3_6_months', label: 'Within 3–6 months' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

/**
 * Remaining Kitchen & Bathroom micro-services → generic pack
 */
const genericKitchenBathroomServices: Array<{ slug: string; name: string; subcategorySlug: string }> = [
  // Kitchen Fitting and Renovation (others)
  { slug: 'new-kitchen-installation', name: 'New kitchen installation', subcategorySlug: 'kitchen-fitting-renovation' },
  { slug: 'kitchen-refurbishment', name: 'Kitchen refurbishment', subcategorySlug: 'kitchen-fitting-renovation' },
  { slug: 'small-kitchen-updates', name: 'Small kitchen updates', subcategorySlug: 'kitchen-fitting-renovation' },

  // Bathroom Fitting and Renovation (others)
  { slug: 'new-bathroom-installation', name: 'New bathroom installation', subcategorySlug: 'bathroom-fitting-renovation' },
  { slug: 'bathroom-refurbishment', name: 'Bathroom refurbishment', subcategorySlug: 'bathroom-fitting-renovation' },
  { slug: 'cloakroom-ensuite-bathrooms', name: 'Cloakroom and ensuite bathrooms', subcategorySlug: 'bathroom-fitting-renovation' },

  // Worktops, Units and Storage
  { slug: 'worktop-installation-replacement', name: 'Worktop installation and replacement', subcategorySlug: 'worktops-units-storage' },
  { slug: 'kitchen-unit-installation', name: 'Kitchen unit installation', subcategorySlug: 'worktops-units-storage' },
  { slug: 'pantry-utility-storage', name: 'Pantry and utility room storage', subcategorySlug: 'worktops-units-storage' },
  { slug: 'kitchen-island-installation', name: 'Kitchen island installation', subcategorySlug: 'worktops-units-storage' },

  // Wetrooms and Specialist Bathrooms (others)
  { slug: 'walk-in-shower-conversions', name: 'Walk-in shower conversions', subcategorySlug: 'wetrooms-specialist-bathrooms' },
  { slug: 'accessible-mobility-bathrooms', name: 'Accessible and mobility bathrooms', subcategorySlug: 'wetrooms-specialist-bathrooms' },
  { slug: 'bathroom-waterproofing-tanking', name: 'Bathroom waterproofing and tanking', subcategorySlug: 'wetrooms-specialist-bathrooms' }
];

const genericKitchenBathroomPacks: MicroservicePackContent[] = genericKitchenBathroomServices.map(s =>
  buildGenericKitchenBathroomPack(s.slug, s.name, s.subcategorySlug)
);

export const kitchenBathroomQuestionPacks: MicroservicePackContent[] = [
  kitchenFittingPack,
  bathroomDesignPack,
  wetroomInstallationPack,
  ...genericKitchenBathroomPacks
];
