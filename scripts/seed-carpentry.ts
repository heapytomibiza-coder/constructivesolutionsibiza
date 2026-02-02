// scripts/seed-carpentry.ts
// Seeds the 3 strong carpentry packs (hand-crafted, non-generic)
// Run with: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" npx tsx scripts/seed-carpentry.ts
// For live: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" DRY_RUN=0 npx tsx scripts/seed-carpentry.ts

import { carpentryQuestionPacks } from "../supabase/functions/_shared/carpentryQuestionPacks.ts";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SEEDER_SECRET = process.env.SEEDER_SECRET;
const DRY_RUN = process.env.DRY_RUN !== "0"; // default dry-run on

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF env var");
  process.exit(1);
}

// Filter to only the 3 strong packs (hand-crafted, non-generic)
const strongPacks = carpentryQuestionPacks.filter(p => 
  ['bespoke-tables', 'sliding-door-wardrobes', 'staircases-handrails'].includes(p.microSlug)
);

const url = `https://${PROJECT_REF}.supabase.co/functions/v1/seedpacks${
  DRY_RUN ? "?dry_run=1" : ""
}`;

console.log(`\n========================================`);
console.log(`Seeding CARPENTRY STRONG PACKS`);
console.log(`========================================\n`);

console.log(`Packs (${strongPacks.length}):`);
strongPacks.forEach(p => console.log(`  - ${p.microSlug} (${p.questions.length} questions)`));
console.log(`\nMode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
console.log(`URL: ${url}\n`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(SEEDER_SECRET ? { Authorization: `Bearer ${SEEDER_SECRET}` } : {}),
  },
  body: JSON.stringify({ packs: strongPacks }),
});

const json = await res.json().catch(() => ({}));
console.log("STATUS:", res.status);
console.log(JSON.stringify(json, null, 2));

if (res.ok && !DRY_RUN) {
  console.log("\n✅ Carpentry packs seeded successfully!");
}

process.exit(res.ok ? 0 : 1);
