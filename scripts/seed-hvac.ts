// scripts/seed-hvac.ts
// Run with: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" npx tsx scripts/seed-hvac.ts
// For live: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" DRY_RUN=0 npx tsx scripts/seed-hvac.ts

import { hvacQuestionPacks } from "../supabase/functions/_shared/hvacQuestionPacks.ts";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SEEDER_SECRET = process.env.SEEDER_SECRET;
const DRY_RUN = process.env.DRY_RUN !== "0"; // default dry-run on

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF env var");
  process.exit(1);
}

const url = `https://${PROJECT_REF}.supabase.co/functions/v1/seed-test${
  DRY_RUN ? "?dry_run=1" : ""
}`;

console.log(`Seeding HVAC packs (${hvacQuestionPacks.length} packs)`);
console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
console.log(`URL: ${url}\n`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(SEEDER_SECRET ? { Authorization: `Bearer ${SEEDER_SECRET}` } : {}),
  },
  body: JSON.stringify({ packs: hvacQuestionPacks }),
});

const json = await res.json().catch(() => ({}));
console.log("STATUS:", res.status);
console.log(JSON.stringify(json, null, 2));

process.exit(res.ok ? 0 : 1);
