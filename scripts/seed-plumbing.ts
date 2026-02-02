// scripts/seed-plumbing.ts
// Seeds the 3 plumbing emergency packs
// Run with: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" npx tsx scripts/seed-plumbing.ts
// For live: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" DRY_RUN=0 npx tsx scripts/seed-plumbing.ts

import { plumbingQuestionPacks } from "../supabase/functions/_shared/plumbingQuestionPacks.ts";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SEEDER_SECRET = process.env.SEEDER_SECRET;
const DRY_RUN = process.env.DRY_RUN !== "0"; // default dry-run on

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF env var");
  process.exit(1);
}

const url = `https://${PROJECT_REF}.supabase.co/functions/v1/seedpacks${
  DRY_RUN ? "?dry_run=1" : ""
}`;

console.log(`\n========================================`);
console.log(`Seeding PLUMBING EMERGENCY PACKS`);
console.log(`========================================\n`);

console.log(`Packs (${plumbingQuestionPacks.length}):`);
plumbingQuestionPacks.forEach(p => console.log(`  - ${p.microSlug} (${p.questions.length} questions)`));
console.log(`\nMode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
console.log(`URL: ${url}\n`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(SEEDER_SECRET ? { Authorization: `Bearer ${SEEDER_SECRET}` } : {}),
  },
  body: JSON.stringify({ packs: plumbingQuestionPacks }),
});

const json = await res.json().catch(() => ({}));
console.log("STATUS:", res.status);
console.log(JSON.stringify(json, null, 2));

if (res.ok && !DRY_RUN) {
  console.log("\n✅ Plumbing packs seeded successfully!");
}

process.exit(res.ok ? 0 : 1);
