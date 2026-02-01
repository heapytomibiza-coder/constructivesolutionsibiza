/**
 * Transport & Delivery Question Packs (V1 Canonical)
 * 
 * These packs are imported as-is from the V1 prototype.
 * Slug aliases are handled by the seeder (furniture-appliance-delivery → furniture-delivery, etc.)
 */

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file';
  options?: QuestionOption[];
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  accept?: string;
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
}

export interface MicroservicePack {
  microSlug: string;
  subcategorySlug: string;
  categorySlug: string;
  name: string;
  questions: Question[];
}

export const transportQuestionPacks: MicroservicePack[] = [
  {
    microSlug: 'man-with-van',
    subcategorySlug: 'small-moves-deliveries',
    categorySlug: 'transport-logistics',
    name: 'Man with Van',
    questions: [
      {
        id: 'service-type',
        question: 'What type of service do you need?',
        type: 'select',
        options: [
          { value: 'single-item', label: 'Single item pickup/delivery' },
          { value: 'multiple-items', label: 'Multiple items' },
          { value: 'small-move', label: 'Small home/office move' },
          { value: 'furniture-assembly', label: 'Delivery + furniture assembly' },
        ],
        required: true,
      },
      {
        id: 'pickup-location',
        question: 'Where is the pickup location?',
        type: 'text',
        placeholder: 'Enter full address or postcode',
        required: true,
      },
      {
        id: 'delivery-location',
        question: 'Where is the delivery location?',
        type: 'text',
        placeholder: 'Enter full address or postcode',
        required: true,
      },
      {
        id: 'item-description',
        question: 'Describe the items to be moved',
        type: 'textarea',
        placeholder: 'e.g., 2-seater sofa, double bed frame, 5 boxes...',
        helpText: 'Include approximate sizes and weights if known',
        required: true,
      },
      {
        id: 'floor-access-pickup',
        question: 'Floor access at pickup location?',
        type: 'select',
        options: [
          { value: 'ground', label: 'Ground floor' },
          { value: 'lift', label: 'Upper floor with lift' },
          { value: 'stairs', label: 'Upper floor with stairs only' },
        ],
      },
      {
        id: 'floor-access-delivery',
        question: 'Floor access at delivery location?',
        type: 'select',
        options: [
          { value: 'ground', label: 'Ground floor' },
          { value: 'lift', label: 'Upper floor with lift' },
          { value: 'stairs', label: 'Upper floor with stairs only' },
        ],
      },
      {
        id: 'preferred-date',
        question: 'When do you need this done?',
        type: 'select',
        options: [
          { value: 'asap', label: 'As soon as possible' },
          { value: 'this-week', label: 'This week' },
          { value: 'next-week', label: 'Next week' },
          { value: 'flexible', label: 'Flexible / specific date' },
        ],
        required: true,
      },
      {
        id: 'photos',
        question: 'Upload photos of items (optional)',
        type: 'file',
        accept: 'image/*',
        helpText: 'Photos help providers give accurate quotes',
      },
    ],
  },
  {
    microSlug: 'furniture-appliance-delivery',
    subcategorySlug: 'small-moves-deliveries',
    categorySlug: 'transport-logistics',
    name: 'Furniture & Appliance Delivery',
    questions: [
      {
        id: 'item-type',
        question: 'What type of item needs delivery?',
        type: 'select',
        options: [
          { value: 'sofa', label: 'Sofa / couch' },
          { value: 'bed', label: 'Bed / mattress' },
          { value: 'wardrobe', label: 'Wardrobe / cabinet' },
          { value: 'table', label: 'Dining / office table' },
          { value: 'appliance-large', label: 'Large appliance (fridge, washer)' },
          { value: 'appliance-small', label: 'Small appliance (microwave, TV)' },
          { value: 'other', label: 'Other furniture' },
        ],
        required: true,
      },
      {
        id: 'item-dimensions',
        question: 'Approximate dimensions (if known)',
        type: 'text',
        placeholder: 'e.g., 200cm x 90cm x 85cm',
        helpText: 'Length x Width x Height',
      },
      {
        id: 'pickup-location',
        question: 'Pickup address',
        type: 'text',
        placeholder: 'Full address or postcode',
        required: true,
      },
      {
        id: 'delivery-location',
        question: 'Delivery address',
        type: 'text',
        placeholder: 'Full address or postcode',
        required: true,
      },
      {
        id: 'assembly-required',
        question: 'Is assembly/disassembly required?',
        type: 'radio',
        options: [
          { value: 'none', label: 'No assembly needed' },
          { value: 'disassembly', label: 'Disassembly at pickup' },
          { value: 'assembly', label: 'Assembly at delivery' },
          { value: 'both', label: 'Both disassembly and assembly' },
        ],
      },
      {
        id: 'floor-info',
        question: 'Any stairs or lift access issues?',
        type: 'textarea',
        placeholder: 'Describe access at both locations...',
        helpText: 'Mention floor levels, narrow doorways, parking restrictions',
      },
      {
        id: 'timing',
        question: 'When do you need delivery?',
        type: 'select',
        options: [
          { value: 'asap', label: 'As soon as possible' },
          { value: 'this-week', label: 'Within this week' },
          { value: 'next-week', label: 'Next week' },
          { value: 'specific', label: 'Specific date needed' },
        ],
        required: true,
      },
      {
        id: 'photos',
        question: 'Photos of items',
        type: 'file',
        accept: 'image/*',
        helpText: 'Helps with accurate quoting',
      },
    ],
  },
  {
    microSlug: 'crane-hire',
    subcategorySlug: 'specialist-transport',
    categorySlug: 'transport-logistics',
    name: 'Crane Hire',
    questions: [
      {
        id: 'crane-type',
        question: 'What type of crane service do you need?',
        type: 'select',
        options: [
          { value: 'mobile', label: 'Mobile crane' },
          { value: 'tower', label: 'Tower crane' },
          { value: 'mini', label: 'Mini/spider crane' },
          { value: 'truck-mounted', label: 'Truck-mounted crane' },
          { value: 'not-sure', label: 'Not sure - need advice' },
        ],
        required: true,
      },
      {
        id: 'lift-weight',
        question: 'Approximate weight to be lifted?',
        type: 'select',
        options: [
          { value: 'under-500kg', label: 'Under 500kg' },
          { value: '500-1000kg', label: '500kg - 1 tonne' },
          { value: '1-5t', label: '1 - 5 tonnes' },
          { value: '5-10t', label: '5 - 10 tonnes' },
          { value: 'over-10t', label: 'Over 10 tonnes' },
          { value: 'unknown', label: 'Unknown - need assessment' },
        ],
        required: true,
      },
      {
        id: 'lift-height',
        question: 'Maximum lift height required?',
        type: 'select',
        options: [
          { value: 'under-10m', label: 'Under 10 metres' },
          { value: '10-20m', label: '10 - 20 metres' },
          { value: '20-30m', label: '20 - 30 metres' },
          { value: 'over-30m', label: 'Over 30 metres' },
          { value: 'unknown', label: 'Need site assessment' },
        ],
      },
      {
        id: 'location',
        question: 'Site location',
        type: 'text',
        placeholder: 'Full address or postcode',
        required: true,
      },
      {
        id: 'site-access',
        question: 'Describe site access conditions',
        type: 'textarea',
        placeholder: 'Road width, ground conditions, overhead cables, etc.',
        helpText: 'Include any restrictions or hazards',
      },
      {
        id: 'duration',
        question: 'How long do you need the crane?',
        type: 'select',
        options: [
          { value: 'hours', label: 'A few hours' },
          { value: 'day', label: 'Full day' },
          { value: 'multi-day', label: 'Multiple days' },
          { value: 'week-plus', label: 'Week or longer' },
        ],
        required: true,
      },
      {
        id: 'operator-needed',
        question: 'Do you need a certified operator?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes, include operator' },
          { value: 'no', label: 'No, we have our own' },
        ],
        required: true,
      },
      {
        id: 'project-details',
        question: 'Additional project details',
        type: 'textarea',
        placeholder: 'Describe what needs to be lifted and any special requirements...',
      },
    ],
  },
  {
    microSlug: 'heavy-equipment-transport',
    subcategorySlug: 'specialist-transport',
    categorySlug: 'transport-logistics',
    name: 'Heavy Equipment Transport',
    questions: [
      {
        id: 'equipment-type',
        question: 'What type of equipment needs transporting?',
        type: 'select',
        options: [
          { value: 'excavator', label: 'Excavator / digger' },
          { value: 'forklift', label: 'Forklift' },
          { value: 'tractor', label: 'Tractor / agricultural' },
          { value: 'generator', label: 'Generator / compressor' },
          { value: 'construction', label: 'Other construction plant' },
          { value: 'industrial', label: 'Industrial machinery' },
          { value: 'other', label: 'Other heavy equipment' },
        ],
        required: true,
      },
      {
        id: 'dimensions-weight',
        question: 'Equipment dimensions and weight',
        type: 'textarea',
        placeholder: 'Length, width, height, and approximate weight...',
        helpText: 'Include any protruding parts or unusual shapes',
        required: true,
      },
      {
        id: 'pickup-location',
        question: 'Pickup location',
        type: 'text',
        placeholder: 'Full address',
        required: true,
      },
      {
        id: 'delivery-location',
        question: 'Delivery location',
        type: 'text',
        placeholder: 'Full address',
        required: true,
      },
      {
        id: 'loading-capability',
        question: 'Loading/unloading situation?',
        type: 'select',
        options: [
          { value: 'self-load', label: 'Equipment can self-load (tracked/wheeled)' },
          { value: 'forklift-available', label: 'Forklift available on site' },
          { value: 'crane-needed', label: 'Will need crane/hiab' },
          { value: 'ramp', label: 'Ramp loading possible' },
        ],
        required: true,
      },
      {
        id: 'timing',
        question: 'When does it need to move?',
        type: 'select',
        options: [
          { value: 'urgent', label: 'Urgent (within 24-48 hours)' },
          { value: 'this-week', label: 'This week' },
          { value: 'next-week', label: 'Next week' },
          { value: 'flexible', label: 'Flexible timing' },
        ],
        required: true,
      },
      {
        id: 'additional-info',
        question: 'Any special requirements or concerns?',
        type: 'textarea',
        placeholder: 'Permits needed, escort vehicles, time restrictions...',
      },
    ],
  },
  {
    microSlug: 'skip-hire-delivery',
    subcategorySlug: 'waste-removal',
    categorySlug: 'transport-logistics',
    name: 'Skip Hire',
    questions: [
      {
        id: 'skip-size',
        question: 'What size skip do you need?',
        type: 'select',
        options: [
          { value: 'mini', label: 'Mini skip (2-3 cubic yards)' },
          { value: 'midi', label: 'Midi skip (4-5 cubic yards)' },
          { value: 'builder', label: 'Builder skip (6-8 cubic yards)' },
          { value: 'large', label: 'Large skip (10-12 cubic yards)' },
          { value: 'ro-ro', label: 'Roll-on/roll-off (20+ cubic yards)' },
          { value: 'not-sure', label: 'Not sure - need advice' },
        ],
        required: true,
        helpText: 'A builder skip holds roughly 60-80 bin bags',
      },
      {
        id: 'waste-type',
        question: 'What type of waste will you be disposing?',
        type: 'checkbox',
        options: [
          { value: 'general', label: 'General household waste' },
          { value: 'garden', label: 'Garden waste' },
          { value: 'construction', label: 'Construction/building waste' },
          { value: 'soil', label: 'Soil and rubble' },
          { value: 'wood', label: 'Wood and timber' },
          { value: 'metal', label: 'Scrap metal' },
        ],
        required: true,
      },
      {
        id: 'delivery-location',
        question: 'Delivery address',
        type: 'text',
        placeholder: 'Full address including postcode',
        required: true,
      },
      {
        id: 'placement',
        question: 'Where will the skip be placed?',
        type: 'radio',
        options: [
          { value: 'driveway', label: 'Private driveway/property' },
          { value: 'road', label: 'Public road (permit required)' },
        ],
        required: true,
      },
      {
        id: 'hire-duration',
        question: 'How long do you need the skip?',
        type: 'select',
        options: [
          { value: '1-week', label: 'Up to 1 week' },
          { value: '2-weeks', label: 'Up to 2 weeks' },
          { value: 'longer', label: 'Longer term hire' },
        ],
        required: true,
      },
      {
        id: 'delivery-date',
        question: 'When do you need it delivered?',
        type: 'select',
        options: [
          { value: 'asap', label: 'As soon as possible' },
          { value: 'this-week', label: 'Later this week' },
          { value: 'next-week', label: 'Next week' },
          { value: 'specific', label: 'Specific date' },
        ],
        required: true,
      },
      {
        id: 'additional-info',
        question: 'Anything else we should know?',
        type: 'textarea',
        placeholder: 'Access restrictions, specific items, collection preferences...',
      },
    ],
  },
  {
    microSlug: 'material-delivery',
    subcategorySlug: 'small-moves-deliveries',
    categorySlug: 'transport-logistics',
    name: 'Material Delivery',
    questions: [
      {
        id: 'material-type',
        question: 'What materials need delivering?',
        type: 'select',
        options: [
          { value: 'aggregates', label: 'Sand, gravel, aggregates' },
          { value: 'timber', label: 'Timber and lumber' },
          { value: 'bricks', label: 'Bricks, blocks, pavers' },
          { value: 'concrete', label: 'Concrete / cement' },
          { value: 'roofing', label: 'Roofing materials' },
          { value: 'plasterboard', label: 'Plasterboard / drywall' },
          { value: 'mixed', label: 'Mixed building materials' },
          { value: 'other', label: 'Other materials' },
        ],
        required: true,
      },
      {
        id: 'quantity',
        question: 'Quantity / volume needed',
        type: 'text',
        placeholder: 'e.g., 2 tonnes, 50 bags, 20 sheets...',
        required: true,
      },
      {
        id: 'pickup-location',
        question: 'Pickup from (if not supplier)',
        type: 'text',
        placeholder: 'Leave blank if supplier delivers, or enter address',
      },
      {
        id: 'delivery-location',
        question: 'Delivery address',
        type: 'text',
        placeholder: 'Full site address',
        required: true,
      },
      {
        id: 'offloading',
        question: 'Offloading requirements',
        type: 'select',
        options: [
          { value: 'tailgate', label: 'Tailgate drop' },
          { value: 'hiab', label: 'Hiab / crane offload needed' },
          { value: 'forklift', label: 'Forklift on site' },
          { value: 'manual', label: 'Manual unload (helpers needed)' },
        ],
        required: true,
      },
      {
        id: 'timing',
        question: 'When do you need delivery?',
        type: 'select',
        options: [
          { value: 'urgent', label: 'Urgent (today/tomorrow)' },
          { value: 'this-week', label: 'This week' },
          { value: 'next-week', label: 'Next week' },
          { value: 'scheduled', label: 'Scheduled date' },
        ],
        required: true,
      },
      {
        id: 'site-notes',
        question: 'Site access notes',
        type: 'textarea',
        placeholder: 'Gate codes, parking, delivery instructions...',
      },
    ],
  },
];
