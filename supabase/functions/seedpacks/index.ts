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
    };

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
        
        cleaned.push({
          id: id || genId(labelOriginal),
          label: labelOriginal,
          type: q.type === "single" ? "radio" : q.type === "multi" ? "checkbox" : q.type,
          options: q.options,
          required: q.required,
          placeholder: q.placeholder,
          help: q.help ?? q.helpText,
          accept: q.accept,
        });
      }

      return { cleaned, duplicates };
    }

    // Normalize packs
    const allDuplicates: Record<string, string[]> = {};
    const normalized: NormalizedPack[] = packs.map((p: Record<string, unknown>) => {
      const microSlug = String(p.microSlug ?? p.slug ?? p.micro_slug ?? "").trim();
      const rawQuestions = (p.questions as Record<string, unknown>[]) || [];
      const { cleaned, duplicates } = dedupeQuestions(rawQuestions);
      
      if (duplicates.length > 0) {
        allDuplicates[microSlug] = duplicates;
      }
      
      return {
        micro_slug: microSlug,
        title: String(p.title ?? p.name ?? "").trim(),
        questions: cleaned,
        is_active: true,
        version: 1,
      };
    });

    // Get valid slugs
    const { data: micros } = await supabase
      .from("service_micro_categories")
      .select("slug")
      .eq("is_active", true);

    const validSlugs = new Set((micros || []).map((m: { slug: string }) => m.slug));
    const valid = normalized.filter((p: NormalizedPack) => validSlugs.has(p.micro_slug));
    const missing = normalized.filter((p: NormalizedPack) => !validSlugs.has(p.micro_slug)).map((p: NormalizedPack) => p.micro_slug);

    if (dryRun) {
      return new Response(JSON.stringify({
        mode: "dry_run",
        rawCount: packs.length,
        validCount: valid.length,
        missingCount: missing.length,
        missingSlugs: missing.slice(0, 30),
        duplicateQuestionIdsBySlug: allDuplicates,
        sample: valid[0] || normalized[0] || null,
      }), {
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
      inserted: data?.length || 0,
      skipped: missing.length,
      missingSlugs: missing.slice(0, 30),
      duplicateQuestionIdsBySlug: allDuplicates,
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
