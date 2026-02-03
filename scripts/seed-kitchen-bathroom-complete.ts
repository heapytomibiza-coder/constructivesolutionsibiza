/**
 * Kitchen & Bathroom Complete Pack Seeder
 * Seeds the 12 remaining K&B micro-services with lite packs
 * 
 * Run with: npx tsx scripts/seed-kitchen-bathroom-complete.ts
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ngwbpuxltyfweikdupoj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2JwdXhsdHlmd2Vpa2R1cG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODg1NzUsImV4cCI6MjA4NTQ2NDU3NX0.ieckD2MOaexZk06ROQuUiGADLa_LlU4kVS-IrIzdqn4';

type QuestionOption = { value: string; label: string };

function normalizeOptions(labels: string[]): QuestionOption[] {
  return labels.map(label => ({
    value: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    label
  }));
}

function buildKBLitePack(slug: string, title: string, taskOptions: string[], scopeOptions: string[]) {
  return {
    micro_slug: slug,
    title,
    version: 1,
    is_active: true,
    metadata: {
      category_contract: 'kitchen-bathroom',
      inspection_bias: 'medium',
      scope_unit: 'items',
      rules: []
    },
    questions: [
      {
        id: `${slug.replace(/-/g, '_')}_01_task`,
        label: 'What do you need?',
        type: 'radio',
        required: true,
        options: normalizeOptions(taskOptions)
      },
      {
        id: `${slug.replace(/-/g, '_')}_02_scope`,
        label: 'How many items or areas?',
        type: 'radio',
        required: true,
        options: normalizeOptions(scopeOptions)
      },
      {
        id: `${slug.replace(/-/g, '_')}_03_room`,
        label: 'Which room?',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Kitchen', 'Main bathroom', 'Ensuite', 'Cloakroom/WC', 'Utility room', 'Other'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_04_property`,
        label: 'Property type',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Apartment', 'House', 'Villa', 'Commercial', 'Other'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_05_existing`,
        label: 'Current situation',
        type: 'radio',
        required: true,
        options: normalizeOptions(['New installation (nothing there)', 'Replacing existing', 'Adding to existing setup', 'Not sure'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_06_urgency`,
        label: 'Urgency',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Flexible', 'Within a week', 'Within 2 weeks', 'Part of larger renovation'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_07_photos`,
        label: 'Upload photos (recommended)',
        type: 'file',
        required: false,
        accept: 'image/jpeg,image/png,image/webp',
        help: 'Photos of the space and any existing fixtures help with accurate quotes.'
      },
      {
        id: `${slug.replace(/-/g, '_')}_08_notes`,
        label: 'Additional notes (optional)',
        type: 'textarea',
        required: false
      }
    ]
  };
}

// 12 missing Kitchen & Bathroom packs
const kbPacks = [
  buildKBLitePack(
    'tap-installation',
    'Tap Installation',
    ['Install new tap', 'Replace existing tap', 'Repair leaking tap', 'Install mixer tap'],
    ['1 tap', '2 taps', '3+ taps']
  ),
  buildKBLitePack(
    'granite-worktops',
    'Granite Worktops',
    ['Supply and install granite worktop', 'Install customer-supplied worktop', 'Replace existing worktop', 'Cut-out for sink/hob'],
    ['Up to 2m length', '2-4m length', '4-6m length', '6m+ or L-shaped']
  ),
  buildKBLitePack(
    'cabinet-installation',
    'Cabinet Installation',
    ['Install new cabinets', 'Replace cabinet doors/fronts', 'Add additional cabinets', 'Repair/adjust existing cabinets'],
    ['1-3 cabinets', '4-8 cabinets', '9-15 cabinets', 'Full kitchen set (15+)']
  ),
  buildKBLitePack(
    'shower-installation',
    'Shower Installation',
    ['Install new shower enclosure', 'Replace existing shower', 'Install walk-in shower', 'Install electric shower'],
    ['1 shower']
  ),
  buildKBLitePack(
    'sink-installation',
    'Sink Installation',
    ['Install new sink', 'Replace existing sink', 'Install undermount sink', 'Install double sink'],
    ['1 sink', '2 sinks']
  ),
  buildKBLitePack(
    'bath-installation',
    'Bath Installation',
    ['Install new bath', 'Replace existing bath', 'Install freestanding bath', 'Install corner bath'],
    ['1 bath']
  ),
  buildKBLitePack(
    'quartz-worktops',
    'Quartz Worktops',
    ['Supply and install quartz worktop', 'Install customer-supplied worktop', 'Replace existing worktop', 'Cut-out for sink/hob'],
    ['Up to 2m length', '2-4m length', '4-6m length', '6m+ or L-shaped']
  ),
  buildKBLitePack(
    'appliance-installation',
    'Appliance Installation',
    ['Install built-in oven', 'Install hob', 'Install dishwasher', 'Install washing machine', 'Install fridge/freezer', 'Multiple appliances'],
    ['1 appliance', '2 appliances', '3+ appliances']
  ),
  buildKBLitePack(
    'toilet-installation',
    'Toilet Installation',
    ['Install new toilet', 'Replace existing toilet', 'Install wall-hung toilet', 'Install concealed cistern'],
    ['1 toilet', '2 toilets']
  ),
  buildKBLitePack(
    'kitchen-renovation',
    'Kitchen Renovation',
    ['Full kitchen renovation', 'Partial renovation (cabinets + worktops)', 'Layout change required', 'Cosmetic refresh only'],
    ['Small kitchen (up to 8m²)', 'Medium kitchen (8-15m²)', 'Large kitchen (15m²+)']
  ),
  buildKBLitePack(
    'bathroom-renovation',
    'Bathroom Renovation',
    ['Full bathroom renovation', 'Partial renovation', 'Layout change required', 'Cosmetic refresh only'],
    ['Small bathroom (up to 4m²)', 'Medium bathroom (4-8m²)', 'Large bathroom (8m²+)']
  ),
  buildKBLitePack(
    'wooden-worktops',
    'Wooden Worktops',
    ['Supply and install wooden worktop', 'Install customer-supplied worktop', 'Replace existing worktop', 'Oil/treat existing wooden worktop'],
    ['Up to 2m length', '2-4m length', '4-6m length', '6m+ or L-shaped']
  )
];

async function seedPacks() {
  console.log(`Seeding ${kbPacks.length} Kitchen & Bathroom packs...`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/seedpacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ packs: kbPacks })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Seed failed:', response.status, text);
    process.exit(1);
  }

  const result = await response.json();
  console.log('Seed result:', JSON.stringify(result, null, 2));
}

seedPacks().catch(console.error);
