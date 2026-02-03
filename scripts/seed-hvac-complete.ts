/**
 * HVAC Complete Pack Seeder
 * Seeds the 15 remaining HVAC micro-services with lite packs
 * 
 * Run with: npx tsx scripts/seed-hvac-complete.ts
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

// Lite pack template for HVAC
function buildHvacLitePack(slug: string, title: string, taskOptions: string[], scopeOptions: string[]) {
  return {
    micro_slug: slug,
    title,
    version: 1,
    is_active: true,
    metadata: {
      category_contract: 'hvac',
      inspection_bias: 'medium',
      scope_unit: 'units',
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
        label: 'How many units or areas?',
        type: 'radio',
        required: true,
        options: normalizeOptions(scopeOptions)
      },
      {
        id: `${slug.replace(/-/g, '_')}_03_property`,
        label: 'Property type',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Apartment', 'House', 'Villa', 'Commercial', 'Other'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_04_existing`,
        label: 'Current situation',
        type: 'radio',
        required: true,
        options: normalizeOptions(['No existing system', 'Existing system needs replacing', 'Existing system needs repair', 'Not sure'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_05_access`,
        label: 'Access to installation area',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Easy access', 'Requires ladder/scaffolding', 'Restricted access', 'Not sure'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_06_urgency`,
        label: 'Urgency',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Emergency (same day)', 'Urgent (24-48 hours)', 'Within a week', 'Flexible'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_07_photos`,
        label: 'Upload photos (recommended)',
        type: 'file',
        required: false,
        accept: 'image/jpeg,image/png,image/webp',
        help: 'Photos of the area and any existing equipment help with accurate quotes.'
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

// 15 missing HVAC packs
const hvacPacks = [
  buildHvacLitePack(
    'extractor-fans',
    'Extractor Fans',
    ['Install new extractor fan', 'Replace existing extractor fan', 'Repair extractor fan', 'Service / clean extractor fan'],
    ['1 fan', '2 fans', '3-4 fans', '5+ fans']
  ),
  buildHvacLitePack(
    'boiler-installation',
    'Boiler Installation',
    ['New boiler installation', 'Replace existing boiler', 'Upgrade to combi boiler', 'Relocate boiler'],
    ['1 boiler (standard)', '1 boiler (large property)', 'Multiple boilers']
  ),
  buildHvacLitePack(
    'ac-installation',
    'AC Installation',
    ['Install wall-mounted split unit', 'Install multi-split system', 'Install ducted AC', 'Install portable AC'],
    ['1 unit', '2 units', '3-4 units', '5+ units']
  ),
  buildHvacLitePack(
    'filter-replacement',
    'Filter Replacement',
    ['Replace AC filters', 'Replace air purifier filters', 'Replace ventilation filters', 'Regular filter service contract'],
    ['1-2 filters', '3-5 filters', '6-10 filters', '10+ filters']
  ),
  buildHvacLitePack(
    'ac-repair',
    'AC Repair',
    ['AC not cooling', 'AC not heating', 'AC making noise', 'AC leaking water', 'AC not turning on', 'Other issue'],
    ['1 unit', '2 units', '3+ units']
  ),
  buildHvacLitePack(
    'duct-installation',
    'Duct Installation',
    ['New duct system', 'Extend existing ducts', 'Replace damaged ducts', 'Add vents/registers'],
    ['1 room', '2-3 rooms', '4-6 rooms', 'Whole building']
  ),
  buildHvacLitePack(
    'system-check',
    'System Check',
    ['Annual AC service', 'Heating system check', 'Full HVAC inspection', 'Pre-purchase inspection'],
    ['1 system', '2 systems', '3+ systems', 'Full property audit']
  ),
  buildHvacLitePack(
    'boiler-repair',
    'Boiler Repair',
    ['Boiler not heating', 'Boiler leaking', 'Boiler making noise', 'No hot water', 'Boiler error code', 'Other issue'],
    ['1 boiler']
  ),
  buildHvacLitePack(
    'duct-cleaning',
    'Duct Cleaning',
    ['Full duct cleaning', 'Vent/register cleaning only', 'Mold remediation', 'Post-construction cleaning'],
    ['Small system (1-3 vents)', 'Medium system (4-8 vents)', 'Large system (9+ vents)']
  ),
  buildHvacLitePack(
    'ac-servicing',
    'AC Servicing',
    ['Annual service', 'Deep clean service', 'Gas top-up included', 'Pre-season check'],
    ['1 unit', '2 units', '3-4 units', '5+ units']
  ),
  buildHvacLitePack(
    'underfloor-heating',
    'Underfloor Heating',
    ['Install electric underfloor heating', 'Install water underfloor heating', 'Repair existing system', 'Add thermostat controls'],
    ['1 room (up to 10m²)', '1 room (10-20m²)', '2-3 rooms', '4+ rooms / whole floor']
  ),
  buildHvacLitePack(
    'air-quality-systems',
    'Air Quality Systems',
    ['Install air purifier', 'Install humidifier/dehumidifier', 'Install CO2 monitor', 'Full air quality assessment'],
    ['1 room', '2-3 rooms', 'Whole property']
  ),
  buildHvacLitePack(
    'split-system',
    'Split System',
    ['Install single split', 'Install multi-split', 'Replace existing split', 'Relocate split unit'],
    ['1 indoor unit', '2 indoor units', '3-4 indoor units', '5+ indoor units']
  ),
  buildHvacLitePack(
    'radiator-installation',
    'Radiator Installation',
    ['Install new radiators', 'Replace existing radiators', 'Add radiators to existing system', 'Install designer radiators'],
    ['1-2 radiators', '3-5 radiators', '6-10 radiators', '10+ radiators']
  ),
  buildHvacLitePack(
    'central-air',
    'Central Air',
    ['New central AC system', 'Replace existing system', 'Upgrade to more efficient system', 'Zone the existing system'],
    ['Small property (1-2 bed)', 'Medium property (3-4 bed)', 'Large property (5+ bed)', 'Commercial']
  )
];

async function seedPacks() {
  console.log(`Seeding ${hvacPacks.length} HVAC packs...`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/seedpacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ packs: hvacPacks })
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
