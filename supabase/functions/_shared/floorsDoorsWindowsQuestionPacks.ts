/**
 * Floors, Doors & Windows Question Packs
 * Defines all micro-service question sets for Floors, Doors & Windows category
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
 * Generic Floors, Doors & Windows pack
 */
function buildGenericFDWPack(
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
      placeholder: 'What needs doing, in which rooms/areas, and any important details?'
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
      id: 'area_room_type',
      question: 'Which areas does the work cover?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'hallway', label: 'Hallway / entrance' },
        { value: 'living', label: 'Living / dining areas' },
        { value: 'bedrooms', label: 'Bedrooms' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bathrooms', label: 'Bathrooms' },
        { value: 'stairs', label: 'Stairs / landings' },
        { value: 'other', label: 'Other areas' }
      ]
    },
    {
      id: 'approx_quantity',
      question: 'Roughly how many items / how much area?',
      type: 'select',
      required: false,
      options: [
        { value: 'single_item', label: 'Single door/window or small area' },
        { value: 'few_items', label: 'A few doors/windows or 1–2 rooms' },
        { value: 'whole_floor', label: 'Most of one floor' },
        { value: 'whole_property', label: 'Whole property' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'materials_supplied',
      question: 'Who will supply the main materials?',
      type: 'radio',
      required: true,
      options: [
        { value: 'client_supplies', label: 'I will supply all main materials' },
        { value: 'installer_supplies', label: 'Installer to supply materials' },
        { value: 'mixed', label: 'A mix of both' },
        { value: 'not_sure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'access',
      question: 'Is there anything important about access, parking or lifts?',
      type: 'textarea',
      required: false,
      placeholder: 'E.g. top floor with no lift, narrow stairs, limited parking, etc.'
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
 * Detailed pack: New flooring installation
 */
const newFlooringInstallationPack: MicroservicePackContent = {
  microSlug: 'new-flooring-installation',
  name: 'New flooring installation',
  subcategorySlug: 'flooring-installation-replacement',
  questions: [
    {
      id: 'floor_areas',
      question: 'Which rooms need new flooring?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'hallway', label: 'Hallway / entrance' },
        { value: 'living', label: 'Living / dining areas' },
        { value: 'bedrooms', label: 'Bedrooms' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bathrooms', label: 'Bathrooms' },
        { value: 'stairs', label: 'Stairs / landings' },
        { value: 'other', label: 'Other areas' }
      ]
    },
    {
      id: 'approx_area',
      question: 'Rough total floor area (if known)?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_20', label: 'Under 20 m²' },
        { value: '20_50', label: '20–50 m²' },
        { value: '50_100', label: '50–100 m²' },
        { value: 'over_100', label: 'Over 100 m²' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'existing_floor',
      question: 'What is the existing floor type now?',
      type: 'select',
      required: true,
      options: [
        { value: 'tiles', label: 'Tiles' },
        { value: 'wood', label: 'Wood' },
        { value: 'laminate', label: 'Laminate' },
        { value: 'vinyl', label: 'Vinyl / Lino' },
        { value: 'carpet', label: 'Carpet' },
        { value: 'concrete', label: 'Bare concrete / screed' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'new_floor_type',
      question: 'What type of new flooring would you like?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'laminate', label: 'Laminate' },
        { value: 'engineered', label: 'Engineered wood' },
        { value: 'solid_wood', label: 'Solid wood' },
        { value: 'tiles', label: 'Tiles / stone' },
        { value: 'vinyl_lvt', label: 'Vinyl / LVT' },
        { value: 'other', label: 'Other / need advice' }
      ]
    },
    {
      id: 'underfloor_heating',
      question: 'Is there, or will there be, underfloor heating?',
      type: 'radio',
      required: false,
      options: [
        { value: 'yes_existing', label: 'Yes – existing underfloor heating' },
        { value: 'yes_planned', label: 'Yes – planning to add underfloor heating' },
        { value: 'no', label: 'No' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'furniture_status',
      question: 'Will the rooms be empty or furnished when the work is done?',
      type: 'select',
      required: true,
      options: [
        { value: 'empty', label: 'Empty rooms (no furniture)' },
        { value: 'part_furnished', label: 'Partly furnished' },
        { value: 'fully_furnished', label: 'Fully furnished' }
      ]
    },
    {
      id: 'skirting_thresholds',
      question: 'Do you also need skirting boards or thresholds supplied/fitted?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'skirting', label: 'New skirting boards' },
        { value: 'replace_skirting', label: 'Remove and refit existing skirting' },
        { value: 'door_bars', label: 'Door thresholds / trims' },
        { value: 'no', label: 'No, flooring only' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the flooring work done?',
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
 * Detailed pack: Internal door fitting
 */
const internalDoorFittingPack: MicroservicePackContent = {
  microSlug: 'internal-door-fitting',
  name: 'Internal door fitting',
  subcategorySlug: 'internal-doors',
  questions: [
    {
      id: 'door_count',
      question: 'How many internal doors need fitting?',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: '1 door' },
        { value: '2_3', label: '2–3 doors' },
        { value: '4_6', label: '4–6 doors' },
        { value: '7plus', label: '7 or more doors' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'frames_existing',
      question: 'Are the door frames already in place?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes_good', label: 'Yes – frames in good condition' },
        { value: 'yes_need_repair', label: 'Yes – but need some repair' },
        { value: 'no_need_new', label: 'No – need new frames/linings' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'doors_supplied',
      question: 'Who will supply the doors?',
      type: 'radio',
      required: true,
      options: [
        { value: 'client', label: 'I will supply the doors' },
        { value: 'installer', label: 'Installer to supply doors' },
        { value: 'mixed', label: 'A mix of both' }
      ]
    },
    {
      id: 'door_style',
      question: 'What type of doors are they?',
      type: 'select',
      required: false,
      options: [
        { value: 'panel', label: 'Standard panel doors' },
        { value: 'flush', label: 'Flush / plain doors' },
        { value: 'glazed', label: 'Glazed internal doors' },
        { value: 'sliding_pocket', label: 'Sliding / pocket doors' },
        { value: 'other', label: 'Other / not sure' }
      ]
    },
    {
      id: 'ironmongery',
      question: 'What needs fitting on the doors?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'handles', label: 'Handles' },
        { value: 'latches', label: 'Latches' },
        { value: 'locks', label: 'Locks' },
        { value: 'hinges', label: 'Hinges' },
        { value: 'stops', label: 'Door stops' }
      ]
    },
    {
      id: 'old_doors_removal',
      question: 'Do old doors need removing and disposing?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes_dispose', label: 'Yes – remove and dispose' },
        { value: 'remove_only', label: 'Remove only, I\'ll dispose' },
        { value: 'no', label: 'No – new openings only' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the doors fitted?',
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
 * Detailed pack: Window installation and replacement
 */
const windowInstallationPack: MicroservicePackContent = {
  microSlug: 'window-installation-replacement',
  name: 'Window installation and replacement',
  subcategorySlug: 'windows-glazing',
  questions: [
    {
      id: 'window_count',
      question: 'How many windows need installing or replacing?',
      type: 'select',
      required: true,
      options: [
        { value: '1', label: '1 window' },
        { value: '2_4', label: '2–4 windows' },
        { value: '5_8', label: '5–8 windows' },
        { value: '9plus', label: '9 or more windows' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'window_type',
      question: 'What type of windows are they?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'standard', label: 'Standard casement / hinged' },
        { value: 'sliding', label: 'Sliding windows' },
        { value: 'tilt_turn', label: 'Tilt and turn' },
        { value: 'fixed', label: 'Fixed / picture windows' },
        { value: 'roof', label: 'Roof windows / skylights' }
      ]
    },
    {
      id: 'frame_material',
      question: 'What frame material do you want?',
      type: 'select',
      required: false,
      options: [
        { value: 'upvc', label: 'uPVC' },
        { value: 'aluminium', label: 'Aluminium' },
        { value: 'wood', label: 'Wood / timber' },
        { value: 'not_sure', label: 'Not sure – need advice' }
      ]
    },
    {
      id: 'glazing_type',
      question: 'What type of glazing are you looking for?',
      type: 'select',
      required: false,
      options: [
        { value: 'double', label: 'Standard double glazing' },
        { value: 'triple', label: 'Triple glazing' },
        { value: 'acoustic', label: 'Acoustic / noise reduction' },
        { value: 'solar', label: 'Solar control / tinted' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'access_floors',
      question: 'What floor(s) are the windows on?',
      type: 'select',
      required: true,
      options: [
        { value: 'ground', label: 'Ground floor' },
        { value: 'first', label: 'First floor' },
        { value: 'second_plus', label: 'Second floor or higher' },
        { value: 'mixed', label: 'Mixed levels' }
      ]
    },
    {
      id: 'scaffolding_expected',
      question: 'Is scaffolding likely to be required?',
      type: 'radio',
      required: false,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'not_sure', label: 'Not sure – need advice' }
      ]
    },
    {
      id: 'old_windows_disposal',
      question: 'Do old windows need removing and disposing?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes_dispose', label: 'Yes – remove and dispose' },
        { value: 'remove_only', label: 'Remove only, I\'ll dispose' },
        { value: 'no', label: 'New openings only' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the window work done?',
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
 * Remaining Floors, Doors & Windows micro-services → generic pack
 */
const genericFDWServices: Array<{ slug: string; name: string; subcategorySlug: string }> = [
  // Flooring
  { slug: 'laminate-engineered-wood', name: 'Laminate and engineered wood', subcategorySlug: 'flooring-installation-replacement' },
  { slug: 'solid-wood-flooring', name: 'Solid wood flooring', subcategorySlug: 'flooring-installation-replacement' },
  { slug: 'tile-stone-flooring', name: 'Tile and stone flooring', subcategorySlug: 'flooring-installation-replacement' },
  { slug: 'vinyl-lvt-flooring', name: 'Vinyl and LVT flooring', subcategorySlug: 'flooring-installation-replacement' },
  { slug: 'floor-sanding-refinishing', name: 'Floor sanding and refinishing', subcategorySlug: 'flooring-installation-replacement' },

  // Internal Doors
  { slug: 'internal-door-replacement', name: 'Internal door replacement', subcategorySlug: 'internal-doors' },
  { slug: 'sliding-pocket-doors', name: 'Sliding and pocket doors', subcategorySlug: 'internal-doors' },
  { slug: 'door-frames-linings', name: 'Door frames and linings', subcategorySlug: 'internal-doors' },
  { slug: 'door-hardware-locks', name: 'Door hardware and locks', subcategorySlug: 'internal-doors' },

  // External Doors and Entrances
  { slug: 'front-door-installation', name: 'Front door installation', subcategorySlug: 'external-doors-entrances' },
  { slug: 'patio-balcony-doors', name: 'Patio and balcony doors', subcategorySlug: 'external-doors-entrances' },
  { slug: 'bifold-large-sliding-doors', name: 'Bifold and large sliding doors', subcategorySlug: 'external-doors-entrances' },
  { slug: 'security-reinforced-doors', name: 'Security and reinforced doors', subcategorySlug: 'external-doors-entrances' },
  { slug: 'garage-doors', name: 'Garage doors', subcategorySlug: 'external-doors-entrances' },

  // Windows and Glazing
  { slug: 'window-repairs-adjustments', name: 'Window repairs and adjustments', subcategorySlug: 'windows-glazing' },
  { slug: 'double-glazing-upgrades', name: 'Double glazing upgrades', subcategorySlug: 'windows-glazing' },
  { slug: 'roof-windows-skylights', name: 'Roof windows and skylights', subcategorySlug: 'windows-glazing' },
  { slug: 'shutters-blinds-screens', name: 'Shutters, blinds and screens', subcategorySlug: 'windows-glazing' }
];

const genericFDWPacks: MicroservicePackContent[] = genericFDWServices.map(s =>
  buildGenericFDWPack(s.slug, s.name, s.subcategorySlug)
);

export const floorsDoorsWindowsQuestionPacks: MicroservicePackContent[] = [
  newFlooringInstallationPack,
  internalDoorFittingPack,
  windowInstallationPack,
  ...genericFDWPacks
];
