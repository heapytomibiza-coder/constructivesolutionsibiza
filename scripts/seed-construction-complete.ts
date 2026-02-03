/**
 * Construction Complete Pack Seeder
 * Seeds the 9 remaining Construction micro-services with lite packs
 * 
 * Run with: npx tsx scripts/seed-construction-complete.ts
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

function buildConstructionLitePack(slug: string, title: string, taskOptions: string[], scopeOptions: string[]) {
  return {
    micro_slug: slug,
    title,
    version: 1,
    is_active: true,
    metadata: {
      category_contract: 'construction',
      inspection_bias: 'high',
      scope_unit: 'area',
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
        label: 'Approximate size or quantity',
        type: 'radio',
        required: true,
        options: normalizeOptions(scopeOptions)
      },
      {
        id: `${slug.replace(/-/g, '_')}_03_property`,
        label: 'Property type',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Apartment', 'House', 'Villa', 'Commercial', 'Outdoor/Garden', 'Other'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_04_existing`,
        label: 'Current situation',
        type: 'radio',
        required: true,
        options: normalizeOptions(['New build/extension', 'Replacing existing', 'Repair work', 'Not sure - need assessment'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_05_access`,
        label: 'Site access',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Easy access', 'Stairs/lift only', 'Restricted vehicle access', 'Not sure'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_06_urgency`,
        label: 'Urgency',
        type: 'radio',
        required: true,
        options: normalizeOptions(['Flexible', 'Within 2 weeks', 'Within a month', 'Part of larger project'])
      },
      {
        id: `${slug.replace(/-/g, '_')}_07_photos`,
        label: 'Upload photos or plans (recommended)',
        type: 'file',
        required: false,
        accept: 'image/jpeg,image/png,image/webp,application/pdf',
        help: 'Photos of the area and any plans help with accurate quotes.'
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

// 9 missing Construction packs
const constructionPacks = [
  buildConstructionLitePack(
    'fit-doors',
    'Fit Doors',
    ['Fit new internal door(s)', 'Fit new external door', 'Replace existing door(s)', 'Adjust/repair door that sticks'],
    ['1 door', '2-3 doors', '4-6 doors', '7+ doors']
  ),
  buildConstructionLitePack(
    'small-repair-job',
    'Small Repair Job',
    ['Patch/repair damaged wall', 'Fix cracks', 'Repair skirting/architrave', 'General handyman repairs'],
    ['Small (under 1 hour work)', 'Medium (1-3 hours work)', 'Multiple small repairs', 'Not sure - need assessment']
  ),
  buildConstructionLitePack(
    'brick-repair',
    'Brick Repair',
    ['Repoint brickwork', 'Replace damaged bricks', 'Repair cracks in brick wall', 'Clean brickwork'],
    ['Small area (under 2m²)', 'Medium area (2-5m²)', 'Large area (5-10m²)', 'Very large (10m²+)']
  ),
  buildConstructionLitePack(
    'stone-wall',
    'Stone Wall',
    ['Build new stone wall', 'Repair existing stone wall', 'Repoint stone wall', 'Demolish stone wall'],
    ['Short wall (under 5m length)', 'Medium wall (5-15m length)', 'Long wall (15m+ length)', 'Multiple walls']
  ),
  buildConstructionLitePack(
    'wall-construction',
    'Wall Construction',
    ['Build new interior wall', 'Build new exterior wall', 'Build retaining wall', 'Knock through wall'],
    ['Small wall (under 3m length)', 'Medium wall (3-6m length)', 'Large wall (6m+ length)', 'Multiple walls']
  ),
  buildConstructionLitePack(
    'build-shelving',
    'Build Shelving',
    ['Fit floating shelves', 'Build built-in shelving', 'Install shelving system', 'Custom shelving unit'],
    ['1-2 shelves', '3-5 shelves', '6-10 shelves', 'Full wall/room shelving']
  ),
  buildConstructionLitePack(
    'install-kitchen-cabinets',
    'Install Kitchen Cabinets',
    ['Install new cabinets (I supply)', 'Supply and install cabinets', 'Replace cabinet doors only', 'Adjust/repair existing cabinets'],
    ['1-5 cabinets', '6-10 cabinets', '11-15 cabinets', '15+ cabinets (full kitchen)']
  ),
  buildConstructionLitePack(
    'demolition',
    'Demolition',
    ['Interior demolition (walls/fixtures)', 'Exterior demolition', 'Full room strip-out', 'Partial demolition'],
    ['Small (single room/feature)', 'Medium (multiple rooms)', 'Large (full floor/building)', 'Not sure - need assessment']
  ),
  buildConstructionLitePack(
    'decking',
    'Decking',
    ['Install new deck', 'Replace existing deck', 'Repair/restore deck', 'Extend existing deck'],
    ['Small deck (under 10m²)', 'Medium deck (10-20m²)', 'Large deck (20-40m²)', 'Very large (40m²+)']
  )
];

async function seedPacks() {
  console.log(`Seeding ${constructionPacks.length} Construction packs...`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/seedpacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ packs: constructionPacks })
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
