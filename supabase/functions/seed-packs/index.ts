/**
 * seed-packs - Safe seeding of question packs from V1 definitions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { ALL_V1_QUESTION_PACKS } from '../_shared/v1QuestionPacks.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Slug aliases for V1 to V2 remapping
const SLUG_ALIASES: Record<string, string> = {
  'furniture-appliance-delivery': 'furniture-delivery',
  'skip-hire-delivery': 'skip-hire',
};

const humanize = (s: string): string =>
  s.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check SEEDER_SECRET or ALLOW_OPEN_SEED
  const expected = Deno.env.get('SEEDER_SECRET');
  const allowOpenSeed = Deno.env.get('ALLOW_OPEN_SEED') === 'true';
  
  if (!expected && !allowOpenSeed) {
    return new Response(
      JSON.stringify({ error: 'SEEDER_SECRET not configured. Set it or enable ALLOW_OPEN_SEED=true for dev.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (expected) {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token !== expected) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else {
    console.warn('[seed-packs] Running without SEEDER_SECRET (ALLOW_OPEN_SEED=true)');
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === '1';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Track aliases applied
    const aliasesApplied: { from: string; to: string }[] = [];

    // Normalize packs from V1 format
    const normalizedPacks = ALL_V1_QUESTION_PACKS.map(p => {
      const rawSlug = String(p.microSlug || '').trim();
      const micro_slug = SLUG_ALIASES[rawSlug] ?? rawSlug;
      
      if (SLUG_ALIASES[rawSlug]) {
        aliasesApplied.push({ from: rawSlug, to: micro_slug });
      }
      
      // Normalize questions: question -> label, helpText -> help
      const questions = (p.questions || []).map(q => ({
        id: q.id,
        label: q.question || '',
        type: q.type,
        options: q.options,
        help: q.helpText,
        placeholder: q.placeholder,
        required: q.required,
        accept: q.accept,
        show_if: q.dependsOn ? {
          question_id: q.dependsOn.questionId,
          ...(Array.isArray(q.dependsOn.value)
            ? { includes_any: q.dependsOn.value }
            : { equals: q.dependsOn.value }),
        } : undefined,
      }));

      return {
        micro_slug,
        title: p.name || humanize(micro_slug),
        questions,
        is_active: true,
        version: 1,
      };
    });

    const inputSlugs = normalizedPacks.map(p => p.micro_slug);

    // Validate slugs exist in taxonomy
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

    const validSlugsSet = new Set((existingMicros || []).map(m => m.slug));
    const validSlugs = inputSlugs.filter(s => validSlugsSet.has(s));
    const missingSlugs = inputSlugs.filter(s => !validSlugsSet.has(s));

    // Dry run response
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
            : `Dry run complete. ${missingSlugs.length} unknown slug(s) found. Fix before importing.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Abort if validation failed
    if (missingSlugs.length > 0) {
      return new Response(
        JSON.stringify({
          mode: 'validation_failed',
          missingSlugs,
          message: `Aborted: ${missingSlugs.length} unknown slug(s). No data was written.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform upsert
    const { data: upserted, error: upsertError } = await supabase
      .from('question_packs')
      .upsert(normalizedPacks, { 
        onConflict: 'micro_slug',
        ignoreDuplicates: false 
      })
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
        message: `Successfully upserted ${upserted?.length || 0} question pack(s).`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
