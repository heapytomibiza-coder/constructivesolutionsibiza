/**
 * Electrical Question Packs
 * Defines all 25 micro-service question sets for Electrical category
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
 * Generic question builder for simpler electrical services
 */
function buildGenericElectricalPack(
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
      placeholder: "What's the issue or job, which room/area, and any key details?"
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
      id: 'occupied',
      question: 'Is the property currently occupied?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes_full', label: 'Yes – fully occupied' },
        { value: 'yes_partial', label: 'Partially occupied' },
        { value: 'no_empty', label: 'No – property is empty' }
      ]
    },
    {
      id: 'access',
      question: 'How easy is access to the area where work is needed?',
      type: 'select',
      required: false,
      options: [
        { value: 'easy', label: 'Easy – direct access' },
        { value: 'moderate', label: 'Moderate – some restrictions' },
        { value: 'difficult', label: 'Difficult – tight/awkward spaces' }
      ]
    },
    {
      id: 'urgency',
      question: 'How urgent is this job?',
      type: 'select',
      required: true,
      options: [
        { value: 'emergency', label: 'Emergency – today if possible' },
        { value: 'soon', label: 'Soon – within 1 week' },
        { value: 'normal', label: 'Within 2–4 weeks' },
        { value: 'flexible', label: 'Flexible / just exploring' }
      ]
    },
    {
      id: 'photos',
      question: 'Do you have any photos of the area, fuse box or issue?',
      type: 'file',
      required: false,
      accept: 'image/*'
    }
  ];

  return { microSlug: slug, subcategorySlug, name, questions };
}

// ========== HAND-CRAFTED QUESTION PACKS ==========

const fullHouseRewiringPack: MicroservicePackContent = {
  microSlug: 'full-house-rewiring',
  subcategorySlug: 'rewiring-new-circuits',
  name: 'Full house rewiring',
  questions: [
    {
      id: 'property_size',
      question: 'Roughly what size is the property?',
      type: 'select',
      required: true,
      options: [
        { value: '1bed', label: '1 bedroom' },
        { value: '2bed', label: '2 bedrooms' },
        { value: '3bed', label: '3 bedrooms' },
        { value: '4plus', label: '4+ bedrooms / large property' }
      ]
    },
    {
      id: 'floors',
      question: 'How many floors does the property have?',
      type: 'select',
      required: false,
      options: [
        { value: '1', label: '1 floor' },
        { value: '2', label: '2 floors' },
        { value: '3plus', label: '3+ floors' }
      ]
    },
    {
      id: 'occupied',
      question: 'Will the property be occupied during the rewiring?',
      type: 'radio',
      required: true,
      options: [
        { value: 'yes', label: 'Yes – people will be living there' },
        { value: 'no', label: 'No – property will be empty' }
      ]
    },
    {
      id: 'existing_wiring_age',
      question: 'How old is the existing wiring (if known)?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_10', label: 'Under 10 years' },
        { value: '10_20', label: '10–20 years' },
        { value: '20_30', label: '20–30 years' },
        { value: 'over_30', label: 'Over 30 years' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'additional_points',
      question: 'Do you want to add more sockets, switches or lighting points?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'more_sockets', label: 'More sockets' },
        { value: 'more_lights', label: 'More lighting points' },
        { value: 'extra_circuits', label: 'Extra circuits (oven, shower, etc.)' },
        { value: 'keep_same', label: 'Keep similar to existing' }
      ]
    },
    {
      id: 'finishes',
      question: 'Do you expect the electrician to make good plaster/decoration afterwards?',
      type: 'radio',
      required: true,
      options: [
        { value: 'electrician', label: 'Yes – electrician to patch walls/ceilings' },
        { value: 'separate_trades', label: 'No – I will use separate trades' },
        { value: 'not_sure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the rewiring to be done?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'ASAP' },
        { value: '1_2_months', label: 'Within 1–2 months' },
        { value: '3_6_months', label: 'Within 3–6 months' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

const consumerUnitReplacementPack: MicroservicePackContent = {
  microSlug: 'fuse-box-consumer-unit-replacement',
  subcategorySlug: 'fuse-boxes-consumer-units',
  name: 'Fuse box / consumer unit replacement',
  questions: [
    {
      id: 'reason',
      question: 'Why are you looking to replace the fuse box / consumer unit?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'old', label: 'Existing unit is very old' },
        { value: 'no_rcd', label: 'No RCD / safety protection' },
        { value: 'tripping', label: 'Circuits keep tripping' },
        { value: 'extension', label: 'Adding new circuits / extension' },
        { value: 'safety', label: 'Safety upgrade / peace of mind' }
      ]
    },
    {
      id: 'number_circuits',
      question: 'Roughly how many circuits do you have now (if you know)?',
      type: 'select',
      required: false,
      options: [
        { value: 'under_6', label: 'Under 6' },
        { value: '6_10', label: '6–10' },
        { value: '10_16', label: '10–16' },
        { value: 'over_16', label: 'More than 16' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'meter_location',
      question: 'Where is the meter and fuse box located?',
      type: 'select',
      required: true,
      options: [
        { value: 'hallway', label: 'Hallway' },
        { value: 'under_stairs', label: 'Under the stairs' },
        { value: 'garage', label: 'Garage' },
        { value: 'outside_cupboard', label: 'Outside cupboard' },
        { value: 'other', label: 'Other location' }
      ]
    },
    {
      id: 'move_needed',
      question: 'Do you want or need the fuse box to be moved?',
      type: 'radio',
      required: true,
      options: [
        { value: 'no', label: 'No – keep in same place' },
        { value: 'small_move', label: 'Move a short distance' },
        { value: 'big_move', label: 'Move to a different area/room' }
      ]
    },
    {
      id: 'report_required',
      question: 'Do you need a formal electrical safety report as part of the job?',
      type: 'radio',
      required: false,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'not_sure', label: 'Not sure – need advice' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like this work done?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'ASAP – issues now' },
        { value: '1_4_weeks', label: 'Within 1–4 weeks' },
        { value: '1_3_months', label: 'Within 1–3 months' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

const indoorLightingPack: MicroservicePackContent = {
  microSlug: 'indoor-lighting-installation',
  subcategorySlug: 'lighting-power',
  name: 'Indoor lighting installation',
  questions: [
    {
      id: 'rooms',
      question: 'Which rooms need lighting work?',
      type: 'checkbox',
      required: true,
      options: [
        { value: 'living_room', label: 'Living room' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bedrooms', label: 'Bedrooms' },
        { value: 'hallways', label: 'Hallways / landings' },
        { value: 'bathrooms', label: 'Bathrooms' },
        { value: 'other', label: 'Other areas' }
      ]
    },
    {
      id: 'job_type',
      question: 'Are you replacing existing lights or adding new ones?',
      type: 'radio',
      required: true,
      options: [
        { value: 'replace', label: 'Replacing existing lights' },
        { value: 'new_points', label: 'Adding new lighting points' },
        { value: 'mix', label: 'Mixture of both' }
      ]
    },
    {
      id: 'lighting_style',
      question: 'What type of lighting are you looking for?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'downlights', label: 'Downlights / spotlights' },
        { value: 'pendants', label: 'Pendant lights' },
        { value: 'wall_lights', label: 'Wall lights' },
        { value: 'led_strip', label: 'LED strip / feature lighting' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'dimmers_smart',
      question: 'Do you want dimmers or smart control?',
      type: 'checkbox',
      required: false,
      options: [
        { value: 'dimmers', label: 'Dimmers' },
        { value: 'smart_switches', label: 'Smart switches' },
        { value: 'smart_bulbs', label: 'Smart bulbs' },
        { value: 'no', label: 'No – standard switches are fine' }
      ]
    },
    {
      id: 'ceiling_type',
      question: 'What type of ceiling do you have?',
      type: 'select',
      required: false,
      options: [
        { value: 'plasterboard', label: 'Plasterboard / false ceiling' },
        { value: 'solid', label: 'Solid concrete/brick' },
        { value: 'wood', label: 'Timber ceiling' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      id: 'finish_making_good',
      question: 'If holes or channels are needed, who will make good (fill and decorate)?',
      type: 'radio',
      required: true,
      options: [
        { value: 'electrician', label: 'Electrician to make good' },
        { value: 'other_trades', label: 'Separate trades will handle it' },
        { value: 'not_sure', label: 'Not sure yet' }
      ]
    },
    {
      id: 'timeline',
      question: 'When would you like the lighting work done?',
      type: 'select',
      required: true,
      options: [
        { value: 'asap', label: 'ASAP' },
        { value: '1_4_weeks', label: 'Within 1–4 weeks' },
        { value: '1_3_months', label: 'Within 1–3 months' },
        { value: 'flexible', label: 'Flexible' }
      ]
    }
  ]
};

// ========== GENERIC PACKS FOR REMAINING 22 MICRO-SERVICES ==========

const genericElectricalServices: Array<{ slug: string; name: string; subcategorySlug: string }> = [
  // Faults, Repairs & Safety
  { slug: 'no-power-tripping-circuits', name: 'No power / tripping circuits', subcategorySlug: 'faults-repairs-safety' },
  { slug: 'fault-finding-repairs', name: 'Fault finding & repairs', subcategorySlug: 'faults-repairs-safety' },
  { slug: 'socket-switch-repairs', name: 'Socket & switch repairs', subcategorySlug: 'faults-repairs-safety' },
  { slug: 'electrical-safety-checks-reports', name: 'Electrical safety checks & reports', subcategorySlug: 'faults-repairs-safety' },
  { slug: 'smoke-heat-alarm-installation', name: 'Smoke & heat alarm installation', subcategorySlug: 'faults-repairs-safety' },

  // Rewiring & New Circuits (other services)
  { slug: 'partial-rewiring', name: 'Partial rewiring', subcategorySlug: 'rewiring-new-circuits' },
  { slug: 'new-circuits-extensions-refits', name: 'New circuits for extensions & refits', subcategorySlug: 'rewiring-new-circuits' },
  { slug: 'new-cooker-oven-circuits', name: 'New cooker / oven circuits', subcategorySlug: 'rewiring-new-circuits' },
  { slug: 'electric-shower-circuits', name: 'Electric shower circuits', subcategorySlug: 'rewiring-new-circuits' },

  // Fuse Boxes & Consumer Units (other services)
  { slug: 'fuse-box-upgrades-rcd-protection', name: 'Fuse box upgrades & RCD protection', subcategorySlug: 'fuse-boxes-consumer-units' },
  { slug: 'earthing-bonding-upgrades', name: 'Earthing & bonding upgrades', subcategorySlug: 'fuse-boxes-consumer-units' },
  { slug: 'moving-consumer-unit', name: 'Moving consumer unit', subcategorySlug: 'fuse-boxes-consumer-units' },

  // Lighting & Power (other services)
  { slug: 'outdoor-garden-lighting', name: 'Outdoor & garden lighting', subcategorySlug: 'lighting-power' },
  { slug: 'downlights-spotlights', name: 'Downlights / spotlights', subcategorySlug: 'lighting-power' },
  { slug: 'feature-led-strip-lighting', name: 'Feature & LED strip lighting', subcategorySlug: 'lighting-power' },
  { slug: 'extra-sockets-power-points', name: 'Extra sockets & power points', subcategorySlug: 'lighting-power' },
  { slug: 'dimmer-smart-switch-installation', name: 'Dimmer & smart switch installation', subcategorySlug: 'lighting-power' },

  // Outdoor & External Electrics
  { slug: 'outdoor-sockets-power-supplies', name: 'Outdoor sockets & power supplies', subcategorySlug: 'outdoor-external-electrics' },
  { slug: 'shed-garage-outbuilding-power', name: 'Shed, garage & outbuilding power', subcategorySlug: 'outdoor-external-electrics' },
  { slug: 'hot-tub-pool-electrical-supply', name: 'Hot tub / pool electrical supply', subcategorySlug: 'outdoor-external-electrics' },
  { slug: 'electric-gates-entrances', name: 'Electric gates & entrances', subcategorySlug: 'outdoor-external-electrics' },
  { slug: 'ev-charger-installation', name: 'EV charger installation', subcategorySlug: 'outdoor-external-electrics' }
];

const genericPacks: MicroservicePackContent[] = genericElectricalServices.map(s =>
  buildGenericElectricalPack(s.slug, s.name, s.subcategorySlug)
);

// ========== EXPORT ALL 25 PACKS ==========

export const electricalQuestionPacks: MicroservicePackContent[] = [
  fullHouseRewiringPack,
  consumerUnitReplacementPack,
  indoorLightingPack,
  ...genericPacks
];
