/**
 * Batch Seeder Script for All New Question Packs
 * Seeds 140 packs across 10 categories
 * 
 * Usage:
 *   npx tsx scripts/seed-all-new-packs.ts           # Dry run (default)
 *   DRY_RUN=0 npx tsx scripts/seed-all-new-packs.ts # Live insert
 *   STRICT=1 npx tsx scripts/seed-all-new-packs.ts  # Reject failing quality packs
 */

import { poolSpaQuestionPacksV2 } from "../supabase/functions/_shared/poolSpaQuestionPacksV2";
import { paintingDecoratingQuestionPacksV2 } from "../supabase/functions/_shared/paintingDecoratingQuestionPacksV2";
import { gardeningLandscapingQuestionPacksV2 } from "../supabase/functions/_shared/gardeningLandscapingQuestionPacksV2";
import { handymanQuestionPacksV2 } from "../supabase/functions/_shared/handymanQuestionPacksV2";
import { cleaningQuestionPacksV2 } from "../supabase/functions/_shared/cleaningQuestionPacksV2";
import { floorsDoorsWindowsQuestionPacksV2 } from "../supabase/functions/_shared/floorsDoorsWindowsQuestionPacksV2";
import { transportLogisticsQuestionPacksV2 } from "../supabase/functions/_shared/transportLogisticsQuestionPacksV2";
import { commercialIndustrialQuestionPacksV2 } from "../supabase/functions/_shared/commercialIndustrialQuestionPacksV2";
import { carpentryQuestionPacksV2 } from "../supabase/functions/_shared/carpentryQuestionPacksV2";
import { architectsDesignQuestionPacksV2 } from "../supabase/functions/_shared/architectsDesignQuestionPacksV2";
import { legalRegulatoryQuestionPacksV2 } from "../supabase/functions/_shared/legalRegulatoryQuestionPacksV2";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ngwbpuxltyfweikdupoj.supabase.co";
const DRY_RUN = process.env.DRY_RUN !== "0";
const STRICT = process.env.STRICT === "1";

// ─────────────────────────────────────────────────────────────────────────────
// Categories to seed
// ─────────────────────────────────────────────────────────────────────────────
const categories = [
  { name: "Pool & Spa", packs: poolSpaQuestionPacksV2 },
  { name: "Painting & Decorating", packs: paintingDecoratingQuestionPacksV2 },
  { name: "Gardening & Landscaping", packs: gardeningLandscapingQuestionPacksV2 },
  { name: "Handyman & General", packs: handymanQuestionPacksV2 },
  { name: "Cleaning", packs: cleaningQuestionPacksV2 },
  { name: "Floors, Doors & Windows", packs: floorsDoorsWindowsQuestionPacksV2 },
  { name: "Transport & Logistics", packs: transportLogisticsQuestionPacksV2 },
  { name: "Commercial & Industrial", packs: commercialIndustrialQuestionPacksV2 },
  { name: "Carpentry", packs: carpentryQuestionPacksV2 },
  { name: "Architects & Design", packs: architectsDesignQuestionPacksV2 },
  { name: "Legal & Regulatory", packs: legalRegulatoryQuestionPacksV2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main execution
// ─────────────────────────────────────────────────────────────────────────────
async function seedCategory(name: string, packs: unknown[]) {
  console.log(`\n📦 Seeding ${name} (${packs.length} packs)...`);

  const url = new URL(`${SUPABASE_URL}/functions/v1/seedpacks`);
  if (DRY_RUN) url.searchParams.set("dry_run", "1");
  if (STRICT) url.searchParams.set("strict", "1");

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packs }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ ${name}: ${result.error || "Unknown error"}`);
      return { name, success: false, error: result.error };
    }

    if (DRY_RUN) {
      console.log(`  ✓ Valid: ${result.validCount}/${result.rawCount}`);
      if (result.missingCount > 0) {
        console.log(`  ⚠ Missing slugs: ${result.missingSlugs?.slice(0, 5).join(", ")}...`);
      }
      if (result.qualitySummary) {
        console.log(`  📊 Quality: STRONG=${result.qualitySummary.STRONG}, ACCEPTABLE=${result.qualitySummary.ACCEPTABLE}, WEAK=${result.qualitySummary.WEAK}, FAILING=${result.qualitySummary.FAILING}`);
      }
    } else {
      console.log(`  ✓ Inserted: ${result.inserted} packs`);
      if (result.skipped > 0) {
        console.log(`  ⚠ Skipped: ${result.skipped} (missing slugs)`);
      }
    }

    return { name, success: true, ...result };
  } catch (err) {
    console.error(`❌ ${name}: ${err}`);
    return { name, success: false, error: String(err) };
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Question Pack Batch Seeder");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE INSERT"}`);
  console.log(`  Strict: ${STRICT ? "YES (reject failing packs)" : "NO"}`);
  console.log("═══════════════════════════════════════════════════════════════");

  const totalPacks = categories.reduce((sum, cat) => sum + cat.packs.length, 0);
  console.log(`\nTotal packs to process: ${totalPacks}`);

  const results = [];
  for (const category of categories) {
    const result = await seedCategory(category.name, category.packs);
    results.push(result);
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✓ Successful: ${successful.length}/${categories.length} categories`);
  if (failed.length > 0) {
    console.log(`✗ Failed: ${failed.map((r) => r.name).join(", ")}`);
  }

  if (!DRY_RUN) {
    const totalInserted = successful.reduce((sum, r) => sum + (r.inserted || 0), 0);
    console.log(`\n🎉 Total packs inserted: ${totalInserted}`);
  } else {
    console.log("\n💡 To insert packs, run: DRY_RUN=0 npx tsx scripts/seed-all-new-packs.ts");
  }
}

main().catch(console.error);
