/**
 * seed-test - Safe seeding of question packs via POST body
 * Usage:
 *  POST /functions/v1/seed-test?dry_run=1   (validate + preview, no writes)
 *  POST /functions/v1/seed-test            (upsert valid packs)
 *
 * Body:
 *  { "packs": [...] }  or  [ ... ]
 *
 * Optional security:
 *  - Set SEEDER_SECRET and call with Authorization: Bearer <secret>
 *  - Or set ALLOW_OPEN_SEED=true for local/dev only
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type AliasPair = { from: string; to: string };

const SLUG_ALIASES: Record<string, string> = {
  "furniture-appliance-delivery": "furniture-delivery",
  "skip-hire-delivery": "skip-hire",
};

const humanize = (s: string): string =>
  s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

const normalizeQuestionType = (type: string): string => {
  const map: Record<string, string> = {
    single: "radio",
    multi: "checkbox",
    yesno: "radio",
    scale: "radio",
  };
  return map[type] ?? type;
};

const getMicroSlug = (p: any): string =>
  String(p.microSlug ?? p.slug ?? p.micro_slug ?? "").trim();

const getTitle = (p: any, microSlug: string): string =>
  String(p.title ?? p.name ?? humanize(microSlug)).trim();

function normalizeQuestion(q: any) {
  const id = String(q.id ?? q.key ?? "").trim();
  const label = String(q.label ?? q.question ?? "").trim();
  const type = normalizeQuestionType(String(q.type ?? "").trim());

  // dependsOn -> show_if (optional)
  let show_if = q.show_if;
  if (!show_if && q.dependsOn) {
    const dep = q.dependsOn;
    show_if = {
      question_id: dep.questionId,
      ...(Array.isArray(dep.value)
        ? { includes_any: dep.value }
        : { equals: dep.value }),
    };
  }

  return {
    id,
    label,
    type,
    options: q.options,
    required: q.required,
    placeholder: q.placeholder,
    help: q.help ?? q.helpText,
    accept: q.accept,
    show_if,
  };
}

function getAuthError(req: Request): string | null {
  const expected = Deno.env.get("SEEDER_SECRET");
  const allowOpen = Deno.env.get("ALLOW_OPEN_SEED") === "true";

  // If neither is set, treat as misconfigured (safer default)
  if (!expected && !allowOpen) {
    return "Seeder is locked. Set SEEDER_SECRET or ALLOW_OPEN_SEED=true (dev only).";
  }

  // If secret is set, enforce it
  if (expected) {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== expected) return "Unauthorized";
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth gate (recommended)
  const authErr = getAuthError(req);
  if (authErr) {
    return new Response(JSON.stringify({ error: authErr }), {
      status: authErr === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse body: {packs:[...]} OR [...]
    const body = await req.json().catch(() => null);
    const packsInput: any[] = Array.isArray(body) ? body : (body?.packs ?? []);

    if (!Array.isArray(packsInput) || packsInput.length === 0) {
      return new Response(
        JSON.stringify({ error: "No packs provided. Send { packs: [...] } or an array." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aliasesApplied: AliasPair[] = [];
    const normalizedPacks = packsInput.map((p: any) => {
      const rawSlug = getMicroSlug(p);
      const micro_slug = SLUG_ALIASES[rawSlug] ?? rawSlug;

      if (SLUG_ALIASES[rawSlug]) aliasesApplied.push({ from: rawSlug, to: micro_slug });

      const title = getTitle(p, micro_slug);
      const questionsRaw = Array.isArray(p.questions) ? p.questions : [];
      const questions = questionsRaw.map(normalizeQuestion);

      return {
        micro_slug,
        title,
        questions,
        is_active: true,
        version: Number(p.version ?? 1),
      };
    });

    // Validate against taxonomy
    const { data: existingMicros, error: microError } = await supabase
      .from("service_micro_categories")
      .select("slug")
      .eq("is_active", true);

    if (microError) {
      return new Response(JSON.stringify({ error: "Failed to fetch taxonomy", details: microError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validSlugsSet = new Set((existingMicros || []).map((m: any) => m.slug));
    const missingSlugs = normalizedPacks.map(p => p.micro_slug).filter(s => !validSlugsSet.has(s));
    const packsToInsert = normalizedPacks.filter(p => validSlugsSet.has(p.micro_slug));

    // Dry run: never writes
    if (dryRun) {
      const sample = packsToInsert[0] ?? normalizedPacks[0] ?? null;
      return new Response(
        JSON.stringify({
          mode: "dry_run",
          rawPackCount: packsInput.length,
          normalizedPackCount: normalizedPacks.length,
          validPackCount: packsToInsert.length,
          missingSlugsCount: missingSlugs.length,
          missingSlugs: missingSlugs.slice(0, 50),
          aliasesApplied: aliasesApplied.length,
          aliasPairs: aliasesApplied,
          taxonomySlugsAvailable: existingMicros?.length || 0,
          sampleNormalizedPack: sample
            ? {
                micro_slug: sample.micro_slug,
                title: sample.title,
                questionCount: Array.isArray(sample.questions) ? sample.questions.length : 0,
                firstQuestion: Array.isArray(sample.questions) ? sample.questions[0] ?? null : null,
              }
            : null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Live: if nothing valid, abort
    if (packsToInsert.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No valid packs to insert", missingSlugs: missingSlugs.slice(0, 100) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert valid only
    const { data: upserted, error: upsertError } = await supabase
      .from("question_packs")
      .upsert(packsToInsert, { onConflict: "micro_slug", ignoreDuplicates: false })
      .select("id, micro_slug, title");

    if (upsertError) {
      return new Response(JSON.stringify({ error: "Upsert failed", details: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: "live",
        inserted: upserted?.length || 0,
        skipped: missingSlugs.length,
        missingSlugs: missingSlugs.slice(0, 50),
        aliasesApplied: aliasesApplied.length,
        aliasPairs: aliasesApplied,
        packs: upserted?.slice(0, 20) || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
