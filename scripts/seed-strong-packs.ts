// scripts/seed-strong-packs.ts
// Seeds all 6 strong packs (3 plumbing + 3 carpentry) at once
// Run with: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" npx tsx scripts/seed-strong-packs.ts
// For live: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" DRY_RUN=0 npx tsx scripts/seed-strong-packs.ts

import { plumbingQuestionPacks } from "../supabase/functions/_shared/plumbingQuestionPacks.ts";
import { carpentryQuestionPacks } from "../supabase/functions/_shared/carpentryQuestionPacks.ts";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SEEDER_SECRET = process.env.SEEDER_SECRET;
const DRY_RUN = process.env.DRY_RUN !== "0"; // default dry-run on

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF env var");
  process.exit(1);
}

// The strong carpentry packs are the first 3 in the array (hand-crafted, non-generic)
const strongCarpentryPacks = carpentryQuestionPacks.filter(p => 
  ['bespoke-tables', 'sliding-door-wardrobes', 'staircases-handrails'].includes(p.microSlug)
);

// All plumbing packs are strong (emergency packs)
const allStrongPacks = [...plumbingQuestionPacks, ...strongCarpentryPacks];

const url = `https://${PROJECT_REF}.supabase.co/functions/v1/seedpacks${
  DRY_RUN ? "?dry_run=1" : ""
}`;

console.log(`\n========================================`);
console.log(`Seeding ALL 6 STRONG PACKS`);
console.log(`========================================\n`);

console.log(`Plumbing (${plumbingQuestionPacks.length} packs):`);
plumbingQuestionPacks.forEach(p => console.log(`  - ${p.microSlug} (${p.questions.length} questions)`));

console.log(`\nCarpentry (${strongCarpentryPacks.length} packs):`);
strongCarpentryPacks.forEach(p => console.log(`  - ${p.microSlug} (${p.questions.length} questions)`));

console.log(`\nTotal: ${allStrongPacks.length} packs`);
console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
console.log(`URL: ${url}\n`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(SEEDER_SECRET ? { Authorization: `Bearer ${SEEDER_SECRET}` } : {}),
  },
  body: JSON.stringify({ packs: allStrongPacks }),
});

const json = await res.json().catch(() => ({}));
console.log("STATUS:", res.status);
console.log(JSON.stringify(json, null, 2));

if (res.ok && !DRY_RUN) {
  console.log("\n✅ Strong packs seeded successfully!");
  console.log("Run this query to verify:");
  console.log(`
SELECT micro_slug, title, jsonb_array_length(questions) as q_count
FROM question_packs 
WHERE micro_slug IN ('burst-pipe', 'sewer-backup', 'water-heater-emergency',
                     'bespoke-tables', 'sliding-door-wardrobes', 'staircases-handrails')
  AND is_active = true;
  `);
}

process.exit(res.ok ? 0 : 1);
