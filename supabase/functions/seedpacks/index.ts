// Seed packs function - accepts POST body
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: require service_role key (admin-only seeding tool)
  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!authHeader.includes(serviceRoleKey) || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Unauthorized — service_role key required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  try {
    const body = await req.json();
    const packs = Array.isArray(body) ? body : (body?.packs ?? []);

    if (!packs.length) {
      return new Response(JSON.stringify({ error: "No packs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    type NormalizedPack = {
      micro_slug: string;
      title: string;
      questions: unknown[];
      is_active: boolean;
      version: number;
      metadata?: Record<string, unknown>;
    };

    // === Quality Validation Constants ===
    const BANNED_PHRASES = [
      "briefly describe",
      "describe your project",
      "what do you need help with",
      "any additional details",
      "please describe",
      "tell us about your project",
    ];

    const MIN_QUESTIONS = 5;
    const OPTIMAL_QUESTIONS_MIN = 5;
    const OPTIMAL_QUESTIONS_MAX = 8;

    // === Deterministic ID generation (stable across re-seeds) ===
    const slugify = (s: string): string =>
      s.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40);

    const hash = (s: string): string =>
      Array.from(new TextEncoder().encode(s))
        .reduce((a, b) => (a * 31 + b) >>> 0, 7)
        .toString(36);

    const genId = (label: string): string => {
      const base = slugify(label);
      return base ? `${base}_${hash(label)}`.slice(0, 48) : `q_${hash(label)}`;
    };

    // === Quality Scoring ===
    function scorePackQuality(questions: Record<string, unknown>[]): {
      score: number;
      tier: "STRONG" | "ACCEPTABLE" | "WEAK" | "FAILING";
      warnings: string[];
    } {
      let score = 0;
      const warnings: string[] = [];
      const qCount = questions.length;

      // Check for banned phrases in any question label
      for (const q of questions) {
        const label = String(q?.label ?? q?.question ?? "").toLowerCase();
        for (const phrase of BANNED_PHRASES) {
          if (label.includes(phrase)) {
            score -= 5;
            warnings.push(`Banned phrase detected: "${phrase}"`);
            break;
          }
        }
      }

      // Question count scoring
      if (qCount >= OPTIMAL_QUESTIONS_MIN && qCount <= OPTIMAL_QUESTIONS_MAX) {
        score += 1;
      } else if (qCount < MIN_QUESTIONS) {
        warnings.push(`Only ${qCount} questions (minimum ${MIN_QUESTIONS})`);
      }

      // Multiple choice ratio
      const mcCount = questions.filter(q => 
        ["radio", "checkbox", "select", "single", "multi"].includes(String(q?.type ?? ""))
      ).length;
      if (qCount > 0 && mcCount / qCount >= 0.7) {
        score += 1;
      }

      // Conditional logic bonus
      const hasConditional = questions.some(q => q?.show_if || q?.dependsOn);
      if (hasConditional) {
        score += 2;
      }

      // Determine tier
      let tier: "STRONG" | "ACCEPTABLE" | "WEAK" | "FAILING";
      if (score < 0) tier = "FAILING";
      else if (score <= 1) tier = "WEAK";
      else if (score <= 4) tier = "ACCEPTABLE";
      else tier = "STRONG";

      return { score, tier, warnings };
    }

    // Dedupe questions by id OR label (handles missing IDs)
    function dedupeQuestions(questions: Record<string, unknown>[]) {
      const seen = new Set<string>();
      const duplicates: string[] = [];
      const cleaned: unknown[] = [];

      for (const q of questions) {
        const id = String(q?.id ?? q?.key ?? "").trim();
        const labelOriginal = String(q?.label ?? q?.question ?? "").trim();
        const labelKey = labelOriginal.toLowerCase();
        const key = id || `label:${labelKey}`;
        
        if (!key || key === "label:") continue;

        if (seen.has(key)) {
          duplicates.push(key);
          continue;
        }
        seen.add(key);
        
        // Normalize dependsOn → show_if for conditional visibility
        const dependsOnRaw = (q.show_if ?? q.dependsOn) as { questionId?: string; question_id?: string; value?: unknown } | undefined;
        const show_if = dependsOnRaw ? {
          questionId: String(dependsOnRaw.questionId ?? dependsOnRaw.question_id ?? ""),
          value: dependsOnRaw.value,
        } : undefined;

        cleaned.push({
          id: id || genId(labelOriginal),
          label: labelOriginal,
          type: q.type === "single" || q.type === "yesno" ? "radio" 
              : q.type === "multi" ? "checkbox" 
              : q.type === "scale" ? "radio"
              : q.type,
          options: q.options,
          required: q.required,
          placeholder: q.placeholder,
          help: q.help ?? q.helpText,
          accept: q.accept,
          show_if,
        });
      }

      return { cleaned, duplicates };
    }

    // Check for strict mode (rejects FAILING quality packs)
    const strictMode = url.searchParams.get("strict") === "1";

    // Normalize packs with quality scoring
    const allDuplicates: Record<string, string[]> = {};
    const qualityReport: Record<string, { tier: string; score: number; warnings: string[] }> = {};
    const failingPacks: string[] = [];

    const normalized: NormalizedPack[] = packs.map((p: Record<string, unknown>) => {
      const microSlug = String(p.microSlug ?? p.slug ?? p.micro_slug ?? "").trim();
      const rawQuestions = (p.questions as Record<string, unknown>[]) || [];
      const { cleaned, duplicates } = dedupeQuestions(rawQuestions);
      
      if (duplicates.length > 0) {
        allDuplicates[microSlug] = duplicates;
      }

      // Score quality
      const quality = scorePackQuality(rawQuestions);
      qualityReport[microSlug] = quality;
      
      if (quality.tier === "FAILING") {
        failingPacks.push(microSlug);
      }
      
      return {
        micro_slug: microSlug,
        title: String(p.title ?? p.name ?? "").trim(),
        questions: cleaned,
        is_active: true,
        version: 1,
        metadata: p.metadata as Record<string, unknown> | undefined,
      };
    });

    // Get valid slugs
    const { data: micros } = await supabase
      .from("service_micro_categories")
      .select("slug")
      .eq("is_active", true);

    const validSlugs = new Set((micros || []).map((m: { slug: string }) => m.slug));
    
    // Filter valid and exclude failing packs in strict mode
    let valid = normalized.filter((p: NormalizedPack) => validSlugs.has(p.micro_slug));
    const missing = normalized.filter((p: NormalizedPack) => !validSlugs.has(p.micro_slug)).map((p: NormalizedPack) => p.micro_slug);

    if (strictMode && failingPacks.length > 0) {
      valid = valid.filter(p => !failingPacks.includes(p.micro_slug));
    }

    // Quality summary
    const qualitySummary = {
      STRONG: Object.values(qualityReport).filter(q => q.tier === "STRONG").length,
      ACCEPTABLE: Object.values(qualityReport).filter(q => q.tier === "ACCEPTABLE").length,
      WEAK: Object.values(qualityReport).filter(q => q.tier === "WEAK").length,
      FAILING: Object.values(qualityReport).filter(q => q.tier === "FAILING").length,
    };

    if (dryRun) {
      return new Response(JSON.stringify({
        mode: "dry_run",
        strictMode,
        rawCount: packs.length,
        validCount: valid.length,
        missingCount: missing.length,
        missingSlugs: missing.slice(0, 30),
        duplicateQuestionIdsBySlug: allDuplicates,
        qualitySummary,
        qualityReport: Object.fromEntries(
          Object.entries(qualityReport).slice(0, 20)
        ),
        failingPacks: strictMode ? failingPacks : undefined,
        sample: valid[0] || normalized[0] || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // In strict mode, reject if any packs are failing
    if (strictMode && failingPacks.length > 0 && valid.length === 0) {
      return new Response(JSON.stringify({ 
        error: "All packs rejected due to quality issues",
        failingPacks,
        qualitySummary,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!valid.length) {
      return new Response(JSON.stringify({ error: "No valid packs", missing }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("question_packs")
      .upsert(valid, { onConflict: "micro_slug" })
      .select("micro_slug, title");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      mode: "live",
      strictMode,
      inserted: data?.length || 0,
      skipped: missing.length,
      missingSlugs: missing.slice(0, 30),
      duplicateQuestionIdsBySlug: allDuplicates,
      qualitySummary,
      rejectedForQuality: strictMode ? failingPacks.length : 0,
      packs: data?.slice(0, 10) || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
