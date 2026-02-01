/**
 * seed-test - Safe seeding of question packs from V1 definitions
 * NOTE: Using static import - dynamic import was crashing
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { ALL_V1_QUESTION_PACKS } from "../_shared/v1QuestionPacks.ts";

// Slug aliases for V1 to V2 remapping
const SLUG_ALIASES: Record<string, string> = {
  'furniture-appliance-delivery': 'furniture-delivery',
  'skip-hire-delivery': 'skip-hire',
};

const humanize = (s: string): string =>
  s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

Deno.serve(async (req: Request) => {
  console.log("seed-test invoked", req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === '1';

  try {
    console.log("Loaded packs count:", ALL_V1_QUESTION_PACKS.length);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const aliasesApplied: Array<{ from: string; to: string }> = [];

    // Normalize packs
    const normalizedPacks = ALL_V1_QUESTION_PACKS.map((p: any) => {
      const rawSlug = String(p.microSlug || '').trim();
      const micro_slug = SLUG_ALIASES[rawSlug] ?? rawSlug;
      
      if (SLUG_ALIASES[rawSlug]) {
        aliasesApplied.push({ from: rawSlug, to: micro_slug });
      }

      const questions = (p.questions || []).map((q: any) => ({
        id: q.id,
        label: q.question || q.label || '',
        type: q.type,
        options: q.options,
        help: q.helpText || q.help,
        placeholder: q.placeholder,
        required: q.required,
        accept: q.accept,
      }));

      return {
        micro_slug,
        title: p.name || humanize(micro_slug),
        questions,
        is_active: true,
        version: 1,
      };
    });

    const inputSlugs = normalizedPacks.map((p: any) => p.micro_slug);

    // Validate slugs against taxonomy
    const { data: existingMicros, error: microError } = await supabase
      .from('service_micro_categories')
      .select('slug')
      .eq('is_active', true);

    if (microError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch taxonomy', details: microError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validSlugsSet = new Set((existingMicros || []).map((m: any) => m.slug));
    const validSlugs = inputSlugs.filter((s: string) => validSlugsSet.has(s));
    const missingSlugs = inputSlugs.filter((s: string) => !validSlugsSet.has(s));

    // Dry run
    if (dryRun) {
      const sample = normalizedPacks[0];
      return new Response(
        JSON.stringify({
          mode: 'dry_run',
          valid: missingSlugs.length === 0,
          packCount: normalizedPacks.length,
          validSlugs,
          missingSlugs,
          aliasesApplied: aliasesApplied.length,
          aliasPairs: aliasesApplied,
          taxonomySlugsAvailable: existingMicros?.length || 0,
          sampleNormalizedPack: sample ? {
            micro_slug: sample.micro_slug,
            title: sample.title,
            questionCount: sample.questions.length,
            firstQuestion: sample.questions[0] || null,
          } : null,
          message: missingSlugs.length === 0 
            ? `Dry run complete. ${normalizedPacks.length} pack(s) ready to insert. ${aliasesApplied.length} alias(es) applied.`
            : `Dry run failed. ${missingSlugs.length} unknown slug(s).`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Abort if invalid
    if (missingSlugs.length > 0) {
      return new Response(
        JSON.stringify({ mode: 'validation_failed', missingSlugs }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert
    const { data: upserted, error: upsertError } = await supabase
      .from('question_packs')
      .upsert(normalizedPacks, { onConflict: 'micro_slug', ignoreDuplicates: false })
      .select('id, micro_slug, title');

    if (upsertError) {
      return new Response(
        JSON.stringify({ error: 'Upsert failed', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'live',
        inserted: upserted?.length || 0,
        packs: upserted,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
