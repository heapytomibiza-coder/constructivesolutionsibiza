/**
 * Pack Quality Audit Script
 * Run: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" npx tsx scripts/audit-pack-quality.ts
 * 
 * Generates a quality report for all question packs in the database.
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF env var");
  process.exit(1);
}

const BANNED_PHRASES = [
  "briefly describe",
  "describe your project",
  "what do you need help with",
  "any additional details",
  "please describe",
  "tell us about your project",
];

interface QuestionPack {
  micro_slug: string;
  title: string;
  questions: unknown[];
  is_active: boolean;
}

interface QualityReport {
  micro_slug: string;
  title: string;
  questionCount: number;
  tier: "STRONG" | "ACCEPTABLE" | "WEAK" | "FAILING";
  score: number;
  warnings: string[];
}

function scorePack(pack: QuestionPack): QualityReport {
  const questions = pack.questions as Record<string, unknown>[];
  let score = 0;
  const warnings: string[] = [];
  const qCount = questions.length;

  // Check for banned phrases
  for (const q of questions) {
    const label = String(q?.label ?? q?.question ?? "").toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      if (label.includes(phrase)) {
        score -= 5;
        warnings.push(`Banned phrase: "${phrase}"`);
        break;
      }
    }
  }

  // Question count
  if (qCount >= 5 && qCount <= 8) {
    score += 1;
  } else if (qCount < 5) {
    warnings.push(`Only ${qCount} questions (min 5)`);
  }

  // Multiple choice ratio
  const mcCount = questions.filter(q => 
    ["radio", "checkbox", "select"].includes(String(q?.type ?? ""))
  ).length;
  if (qCount > 0 && mcCount / qCount >= 0.7) {
    score += 1;
  }

  // Conditional logic
  const hasConditional = questions.some(q => 
    (q as Record<string, unknown>)?.show_if || (q as Record<string, unknown>)?.dependsOn
  );
  if (hasConditional) {
    score += 2;
  }

  // Determine tier
  let tier: "STRONG" | "ACCEPTABLE" | "WEAK" | "FAILING";
  if (score < 0) tier = "FAILING";
  else if (score <= 1) tier = "WEAK";
  else if (score <= 4) tier = "ACCEPTABLE";
  else tier = "STRONG";

  return {
    micro_slug: pack.micro_slug,
    title: pack.title,
    questionCount: qCount,
    tier,
    score,
    warnings,
  };
}

async function main() {
  const url = `https://${PROJECT_REF}.supabase.co/rest/v1/question_packs?select=micro_slug,title,questions,is_active&is_active=eq.true`;
  
  const headers: Record<string, string> = {
    "apikey": SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2JwdXhsdHlmd2Vpa2R1cG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODg1NzUsImV4cCI6MjA4NTQ2NDU3NX0.ieckD2MOaexZk06ROQuUiGADLa_LlU4kVS-IrIzdqn4",
    "Authorization": `Bearer ${SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2JwdXhsdHlmd2Vpa2R1cG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODg1NzUsImV4cCI6MjA4NTQ2NDU3NX0.ieckD2MOaexZk06ROQuUiGADLa_LlU4kVS-IrIzdqn4"}`,
  };

  console.log("Fetching question packs from database...\n");
  
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error("Failed to fetch:", res.status, await res.text());
    process.exit(1);
  }

  const packs: QuestionPack[] = await res.json();
  console.log(`Found ${packs.length} active packs\n`);

  // Score all packs
  const reports = packs.map(scorePack);

  // Group by tier
  const byTier = {
    STRONG: reports.filter(r => r.tier === "STRONG"),
    ACCEPTABLE: reports.filter(r => r.tier === "ACCEPTABLE"),
    WEAK: reports.filter(r => r.tier === "WEAK"),
    FAILING: reports.filter(r => r.tier === "FAILING"),
  };

  // Summary
  console.log("=== QUALITY SUMMARY ===");
  console.log(`STRONG:     ${byTier.STRONG.length} (${(byTier.STRONG.length / packs.length * 100).toFixed(1)}%)`);
  console.log(`ACCEPTABLE: ${byTier.ACCEPTABLE.length} (${(byTier.ACCEPTABLE.length / packs.length * 100).toFixed(1)}%)`);
  console.log(`WEAK:       ${byTier.WEAK.length} (${(byTier.WEAK.length / packs.length * 100).toFixed(1)}%)`);
  console.log(`FAILING:    ${byTier.FAILING.length} (${(byTier.FAILING.length / packs.length * 100).toFixed(1)}%)`);
  console.log();

  // Strong packs
  if (byTier.STRONG.length > 0) {
    console.log("=== STRONG PACKS ===");
    byTier.STRONG.forEach(r => {
      console.log(`  ✅ ${r.micro_slug} (${r.questionCount} questions, score: ${r.score})`);
    });
    console.log();
  }

  // Failing packs (need immediate attention)
  if (byTier.FAILING.length > 0) {
    console.log("=== FAILING PACKS (NEED REWRITE) ===");
    byTier.FAILING.forEach(r => {
      console.log(`  ❌ ${r.micro_slug}`);
      r.warnings.forEach(w => console.log(`     ⚠️  ${w}`));
    });
    console.log();
  }

  // Weak packs (top 20)
  if (byTier.WEAK.length > 0) {
    console.log("=== WEAK PACKS (TOP 20) ===");
    byTier.WEAK.slice(0, 20).forEach(r => {
      console.log(`  ⚠️  ${r.micro_slug} (${r.questionCount} questions)`);
      if (r.warnings.length > 0) {
        console.log(`     Warnings: ${r.warnings.join(", ")}`);
      }
    });
    if (byTier.WEAK.length > 20) {
      console.log(`  ... and ${byTier.WEAK.length - 20} more`);
    }
    console.log();
  }

  // Export to JSON
  const outputPath = "pack-quality-report.json";
  const fs = await import("fs/promises");
  await fs.writeFile(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: {
      total: packs.length,
      strong: byTier.STRONG.length,
      acceptable: byTier.ACCEPTABLE.length,
      weak: byTier.WEAK.length,
      failing: byTier.FAILING.length,
    },
    reports: reports.sort((a, b) => a.score - b.score),
  }, null, 2));
  
  console.log(`Full report saved to: ${outputPath}`);
}

main().catch(console.error);
