/**
 * HVAC Question Packs
 * Comprehensive question packs for HVAC & Climate Control services
 */

type QuestionOption = { value: string; label: string };

type QuestionDef = {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'file';
  required: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  accept?: string;
};

export type MicroservicePackContent = {
  microSlug: string;
  subcategorySlug: string;
  name: string;
  questions: QuestionDef[];
};

/**
 * Generic HVAC pack builder
 */
const buildGenericHvacPack = (
  microSlug: string,
  readableName: string,
  subcategorySlug: string
): MicroservicePackContent => {
  const questions: QuestionDef[] = [
    {
      id: 'description',
      question: `Briefly describe what you need for "${readableName}".`,
      type: 'textarea',
      required: true,
      placeholder: 'What is the issue or goal, which rooms are affected, and any important details?'
    },
    {
      id: 'property_type',
      question: 'What type of property is this?',
      type: 'select',
      required: true,
      options: [
        { value: 'apartment', label: 'Apartment' },
        { value: 'villa_house', label: 'Villa / house' },
        { value: 'community_building', label: 'Community building' },
        { value: 'hotel_guesthouse', label: 'Hotel / guesthouse' },
        { value: 'commercial', label: 'Commercial property' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'area_type',
      question: 'Which areas are involved?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'bedrooms', label: 'Bedrooms' },
        { value: 'living_areas', label: 'Living / lounge areas' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bathrooms', label: 'Bathrooms' },
        { value: 'whole_property', label: 'Whole property' },
        { value: 'outdoor', label: 'Outdoor / terrace' }
      ]
    },
    {
      id: 'existing_system',
      question: 'Do you already have any AC or heating system installed?',
      type: 'select',
      required: false,
      options: [
        { value: 'no_system', label: 'No system installed yet' },
        { value: 'wall_splits', label: 'Wall split units' },
        { value: 'ducted_ac', label: 'Ducted AC system' },
        { value: 'heat_pump', label: 'Heat pump' },
        { value: 'radiators', label: 'Radiator system' },
        { value: 'other', label: 'Other / not sure' }
      ]
    },
    {
      id: 'access_difficulty',
      question: 'How is access to the main work area?',
      type: 'select',
      required: false,
      options: [
        { value: 'easy', label: 'Easy – ground floor with easy parking' },
        { value: 'stairs_only', label: 'Upper floor – stairs only' },
        { value: 'rooftop', label: 'Rooftop / difficult access' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'urgency',
      question: 'How urgent is this job?',
      type: 'select',
      required: true,
      options: [
        { value: 'emergency', label: 'Emergency – no cooling/heating' },
        { value: 'soon', label: 'Soon – within 1–2 weeks' },
        { value: 'this_month', label: 'Within this month' },
        { value: 'flexible', label: 'Flexible / just planning' }
      ]
    },
    {
      id: 'photos',
      question: 'Do you have any photos or videos of the area or existing units?',
      type: 'file',
      required: false,
      accept: 'image/*,video/*'
    }
  ];

  return { microSlug, subcategorySlug, name: readableName, questions };
};

// ========== HAND-CRAFTED PACKS ==========

const newAcInstallationPack: MicroservicePackContent = {
  microSlug: 'wall-split-ac-installation',
  subcategorySlug: 'ac-installation-upgrade',
  name: 'Wall split AC installation',
  questions: [
    {
      id: 'rooms_to_cover',
      question: 'How many rooms or zones do you want to cool?',
      type: 'select',
      required: true,
      options: [
        { value: 'one_room', label: 'Just one room' },
        { value: 'two_three', label: '2–3 rooms' },
        { value: 'four_plus', label: '4 or more rooms' },
        { value: 'whole_property', label: 'Whole property' }
      ]
    },
    {
      id: 'preferred_system_type',
      question: 'Do you have a preferred system type?',
      type: 'select',
      required: false,
      options: [
        { value: 'wall_splits', label: 'Wall split units' },
        { value: 'multi_split', label: 'Multi-split system' },
        { value: 'ducted', label: 'Ducted system' },
        { value: 'not_sure', label: 'Not sure – need advice' }
      ]
    },
    {
      id: 'indoor_unit_location',
      question: 'Where can indoor units be installed?',
      type: 'textarea',
      required: false,
      placeholder: 'Existing pipework, false ceilings, wall space, etc.'
    },
    {
      id: 'outdoor_unit_location',
      question: 'Where could the outdoor unit(s) go?',
      type: 'select',
      required: false,
      options: [
        { value: 'ground_terrace', label: 'Ground / terrace' },
        { value: 'balcony', label: 'Balcony' },
        { value: 'rooftop', label: 'Rooftop' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'noise_sensitivity',
      question: 'Is noise a particular concern?',
      type: 'radio',
      required: false,
      options: [
        { value: 'yes_sensitive', label: 'Yes – very sensitive to noise' },
        { value: 'somewhat', label: 'Somewhat important' },
        { value: 'not_really', label: 'Not really' }
      ]
    },
    {
      id: 'budget_range',
      question: 'Do you have a budget range in mind for the installation?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_3k', label: 'Under €3k' },
        { value: '3k_7k', label: '€3k–€7k' },
        { value: '7k_15k', label: '€7k–€15k' },
        { value: 'over_15k', label: 'Over €15k' },
        { value: 'not_sure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the installation to be completed?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: 'within_month', label: 'Within the next month' },
        { value: '1_3_months', label: 'Within 1–3 months' },
        { value: 'flexible', label: 'Flexible / planning ahead' }
      ]
    }
  ]
};

const regularAcServicingPack: MicroservicePackContent = {
  microSlug: 'regular-ac-servicing',
  subcategorySlug: 'ac-servicing-repairs',
  name: 'Regular AC servicing',
  questions: [
    {
      id: 'number_of_units',
      question: 'Roughly how many AC units need servicing?',
      type: 'select',
      required: true,
      options: [
        { value: 'one_two', label: '1–2 units' },
        { value: 'three_five', label: '3–5 units' },
        { value: 'six_plus', label: '6 or more units' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'unit_types',
      question: 'What type of units do you have?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'wall_splits', label: 'Wall split units' },
        { value: 'ducted', label: 'Ducted AC' },
        { value: 'cassette', label: 'Ceiling cassette units' },
        { value: 'other', label: 'Other / mixed' }
      ]
    },
    {
      id: 'last_service',
      question: 'When were the units last serviced?',
      type: 'select',
      required: false,
      options: [
        { value: 'less_1_year', label: 'Within the last year' },
        { value: '1_2_years', label: '1–2 years ago' },
        { value: '2_plus_years', label: 'More than 2 years ago' },
        { value: 'never', label: 'Never / not sure' }
      ]
    },
    {
      id: 'any_issues',
      question: 'Are there any current issues the technician should know about?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'not_cooling', label: 'Not cooling properly' },
        { value: 'water_leaks', label: 'Water leaks' },
        { value: 'bad_smell', label: 'Bad smell' },
        { value: 'noisy', label: 'Very noisy' },
        { value: 'other', label: 'Other issues' },
        { value: 'no_issues', label: 'No issues – preventive service only' }
      ]
    },
    {
      id: 'access_details',
      question: 'How will the technician access the property?',
      type: 'textarea',
      required: false,
      placeholder: 'Gate codes, concierge, keys, on-site staff, etc.'
    },
    {
      id: 'service_frequency',
      question: 'Are you looking for a one-off service or ongoing maintenance?',
      type: 'radio',
      required: true,
      options: [
        { value: 'one_off', label: 'One-off service' },
        { value: 'twice_year', label: 'Regular – twice per year' },
        { value: 'annual', label: 'Regular – once per year' }
      ]
    },
    {
      id: 'preferred_timing',
      question: 'Preferred timing for servicing?',
      type: 'select',
      required: true,
      options: [
        { value: 'weekday_mornings', label: 'Weekday mornings' },
        { value: 'weekday_afternoons', label: 'Weekday afternoons' },
        { value: 'weekends', label: 'Weekends' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

const heatingSystemInstallationPack: MicroservicePackContent = {
  microSlug: 'heat-pump-installation',
  subcategorySlug: 'heating-systems',
  name: 'Heat pump installation',
  questions: [
    {
      id: 'heating_goal',
      question: 'What is your main goal for the heating system?',
      type: 'select',
      required: true,
      options: [
        { value: 'new_system', label: 'Install a completely new system' },
        { value: 'upgrade_existing', label: 'Upgrade an existing system' },
        { value: 'extend_existing', label: 'Extend an existing system to more rooms' }
      ]
    },
    {
      id: 'heated_areas',
      question: 'Which areas need heating?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'bedrooms', label: 'Bedrooms' },
        { value: 'living_areas', label: 'Living / lounge areas' },
        { value: 'bathrooms', label: 'Bathrooms' },
        { value: 'whole_property', label: 'Whole property' }
      ]
    },
    {
      id: 'preferred_heating_type',
      question: 'Do you have a preferred heating type?',
      type: 'select',
      required: false,
      options: [
        { value: 'heat_pump', label: 'Heat pump (air source)' },
        { value: 'underfloor', label: 'Underfloor heating' },
        { value: 'radiators', label: 'Radiators' },
        { value: 'not_sure', label: 'Not sure – need advice' }
      ]
    },
    {
      id: 'insulation_quality',
      question: 'How well insulated is the property?',
      type: 'select',
      required: false,
      options: [
        { value: 'good', label: 'Good – modern insulation' },
        { value: 'average', label: 'Average' },
        { value: 'poor', label: 'Poor – older property' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'energy_priority',
      question: 'What is most important to you?',
      type: 'select',
      required: false,
      options: [
        { value: 'low_running_cost', label: 'Low running cost' },
        { value: 'low_install_cost', label: 'Lowest installation cost' },
        { value: 'eco_friendly', label: 'Eco-friendly / low emissions' },
        { value: 'balanced', label: 'Balanced mix' }
      ]
    },
    {
      id: 'budget_range',
      question: 'Do you have a budget range in mind?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_5k', label: 'Under €5k' },
        { value: '5k_12k', label: '€5k–€12k' },
        { value: '12k_25k', label: '€12k–€25k' },
        { value: 'over_25k', label: 'Over €25k' },
        { value: 'not_sure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the heating work to be done?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'As soon as possible' },
        { value: 'off_season', label: 'Off-season (less urgent)' },
        { value: 'next_season', label: 'Before next winter season' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

// ========== GENERIC PACKS ==========

const genericHvacServices: { microSlug: string; name: string; subcategorySlug: string }[] = [
  // AC installation & upgrades
  { microSlug: 'multi-split-ac-installation', name: 'Multi-split AC installation', subcategorySlug: 'ac-installation-upgrade' },
  { microSlug: 'ducted-ac-installation', name: 'Ducted AC installation', subcategorySlug: 'ac-installation-upgrade' },
  { microSlug: 'ac-relocation', name: 'AC unit relocation', subcategorySlug: 'ac-installation-upgrade' },
  { microSlug: 'ac-upgrade-replacement', name: 'AC system upgrade or replacement', subcategorySlug: 'ac-installation-upgrade' },

  // AC servicing & repairs
  { microSlug: 'ac-emergency-repair', name: 'AC emergency repair', subcategorySlug: 'ac-servicing-repairs' },
  { microSlug: 'ac-gas-recharge', name: 'AC gas recharge', subcategorySlug: 'ac-servicing-repairs' },
  { microSlug: 'ac-leak-detection-repair', name: 'AC leak detection & repair', subcategorySlug: 'ac-servicing-repairs' },
  { microSlug: 'ac-poor-performance-noise', name: 'AC poor performance / noise issues', subcategorySlug: 'ac-servicing-repairs' },

  // Heating systems
  { microSlug: 'underfloor-heating-installation', name: 'Underfloor heating installation', subcategorySlug: 'heating-systems' },
  { microSlug: 'radiator-system-installation', name: 'Radiator system installation', subcategorySlug: 'heating-systems' },
  { microSlug: 'heating-system-servicing-repair', name: 'Heating system servicing & repair', subcategorySlug: 'heating-systems' },

  // Ventilation & air quality
  { microSlug: 'mechanical-ventilation-install', name: 'Mechanical ventilation installation', subcategorySlug: 'ventilation-air-quality' },
  { microSlug: 'kitchen-extractor-installation', name: 'Kitchen extractor installation', subcategorySlug: 'ventilation-air-quality' },
  { microSlug: 'bathroom-extractor-installation', name: 'Bathroom extractor installation', subcategorySlug: 'ventilation-air-quality' },
  { microSlug: 'air-purifier-filter-systems', name: 'Air purifier & filter systems', subcategorySlug: 'ventilation-air-quality' },

  // Controls & efficiency
  { microSlug: 'smart-thermostat-installation', name: 'Smart thermostat installation', subcategorySlug: 'controls-efficiency' },
  { microSlug: 'zoning-and-controls', name: 'Zoning & control systems', subcategorySlug: 'controls-efficiency' },
  { microSlug: 'energy-efficiency-assessment', name: 'Energy efficiency assessment', subcategorySlug: 'controls-efficiency' }
];

const genericHvacPacks: MicroservicePackContent[] = genericHvacServices.map(s =>
  buildGenericHvacPack(s.microSlug, s.name, s.subcategorySlug)
);

// ========== EXPORT ALL 21 PACKS ==========

export const hvacQuestionPacks: MicroservicePackContent[] = [
  newAcInstallationPack,
  regularAcServicingPack,
  heatingSystemInstallationPack,
  ...genericHvacPacks
];
