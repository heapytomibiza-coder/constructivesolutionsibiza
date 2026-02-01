/**
 * seed-question-packs - Safe seeding of question packs from V1 definitions
 * 
 * Safety features:
 * - Dry-run mode (?dry_run=1) - validates without writing
 * - Slug validation - fails fast if any micro_slug doesn't exist in service_micro_categories
 * - Upsert on micro_slug - prevents duplicates
 * - Field normalization - handles V1 format differences (question→label, name→title)
 * 
 * Usage:
 *   POST /seed-question-packs?dry_run=1  → validate only
 *   POST /seed-question-packs            → insert/update packs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ Normalization Helpers ============

// Convert slug to human-readable title
const humanize = (s: string): string =>
  s.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Get title from V1 pack (handles: title, name, or fallback to humanized slug)
const normalizeTitle = (pack: Record<string, unknown>, microSlug: string): string =>
  (pack.title as string) || (pack.name as string) || humanize(microSlug);

// Normalize V1 question format to V2 format
// V1: { id, question, type, options, helpText, dependsOn }
// V2: { id, label, type, options, help, placeholder, required, show_if }
interface V1Question {
  id: string;
  question?: string;
  label?: string;
  type: string;
  options?: unknown[];
  helpText?: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
  show_if?: unknown;
}

interface V2Question {
  id: string;
  label: string;
  type: string;
  options?: unknown[];
  help?: string;
  placeholder?: string;
  required?: boolean;
  show_if?: {
    question_id: string;
    equals?: string;
    includes_any?: string[];
  };
}

const normalizeQuestions = (questions: V1Question[]): V2Question[] =>
  (questions || []).map(q => {
    const normalized: V2Question = {
      id: q.id,
      label: q.label ?? q.question ?? '',
      type: q.type,
    };

    // Preserve options as-is (already {value,label} format in V1)
    if (q.options) {
      normalized.options = q.options;
    }

    // Normalize help text
    if (q.help || q.helpText) {
      normalized.help = q.help ?? q.helpText;
    }

    // Preserve placeholder and required
    if (q.placeholder) normalized.placeholder = q.placeholder;
    if (q.required !== undefined) normalized.required = q.required;

    // Convert dependsOn to show_if
    if (q.show_if) {
      normalized.show_if = q.show_if as V2Question['show_if'];
    } else if (q.dependsOn) {
      const dep = q.dependsOn;
      normalized.show_if = {
        question_id: dep.questionId,
        ...(Array.isArray(dep.value)
          ? { includes_any: dep.value }
          : { equals: dep.value }),
      };
    }

    return normalized;
  });

// ============ Input Types ============

interface QuestionPackInput {
  slug?: string;        // V1 format
  microSlug?: string;   // Alternative V1 key
  title?: string;
  name?: string;        // V1 alternative to title
  questions: V1Question[];
}

interface ValidationResult {
  valid: boolean;
  packCount: number;
  validSlugs: string[];
  missingSlugs: string[];
  errors: string[];
}

// ============ Main Handler ============

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

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === '1';

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse input packs
    const body = await req.json();
    const packs: QuestionPackInput[] = Array.isArray(body) ? body : body.packs || [];

    if (!packs.length) {
      return new Response(
        JSON.stringify({ error: 'No packs provided. Send { packs: [...] } or an array.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize packs with proper field mapping
    const normalizedPacks = packs.map(p => {
      const micro_slug = p.slug || p.microSlug || '';
      return {
        micro_slug,
        title: p.title || p.name || humanize(micro_slug),
        questions: normalizeQuestions(p.questions),
        is_active: true,
      };
    });

    const inputSlugs = normalizedPacks.map(p => p.micro_slug).filter(Boolean);
    
    if (inputSlugs.length !== normalizedPacks.length) {
      const missingCount = normalizedPacks.length - inputSlugs.length;
      return new Response(
        JSON.stringify({ 
          error: `${missingCount} pack(s) are missing slug/microSlug`,
          packCount: packs.length,
          slugCount: inputSlugs.length 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active micro slugs from the SAME table the wizard uses
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
    
    // Validate all input slugs exist in taxonomy
    const validSlugs: string[] = [];
    const missingSlugs: string[] = [];
    
    for (const slug of inputSlugs) {
      if (validSlugsSet.has(slug)) {
        validSlugs.push(slug);
      } else {
        missingSlugs.push(slug);
      }
    }

    const validation: ValidationResult = {
      valid: missingSlugs.length === 0,
      packCount: packs.length,
      validSlugs,
      missingSlugs,
      errors: missingSlugs.map(s => `Unknown or inactive micro_slug: ${s}`),
    };

    // If dry run, return validation result with sample normalized data
    if (dryRun) {
      const samplePack = normalizedPacks[0];
      return new Response(
        JSON.stringify({
          mode: 'dry_run',
          ...validation,
          taxonomySlugsAvailable: existingMicros?.length || 0,
          sampleNormalizedPack: samplePack ? {
            micro_slug: samplePack.micro_slug,
            title: samplePack.title,
            questionCount: samplePack.questions.length,
            firstQuestion: samplePack.questions[0] || null,
          } : null,
          message: validation.valid 
            ? `Dry run complete. ${validation.packCount} pack(s) ready to insert.`
            : `Dry run complete. ${missingSlugs.length} unknown slug(s) found. Fix before importing.`,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If validation failed, abort
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          mode: 'validation_failed',
          ...validation,
          message: `Aborted: ${missingSlugs.length} unknown slug(s). No data was written.`,
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Perform upsert (version column exists per earlier migration check)
    const packsToUpsert = normalizedPacks.map(p => ({
      micro_slug: p.micro_slug,
      title: p.title,
      questions: p.questions,
      is_active: true,
      version: 1,
    }));

    const { data: upserted, error: upsertError } = await supabase
      .from('question_packs')
      .upsert(packsToUpsert, { 
        onConflict: 'micro_slug',
        ignoreDuplicates: false 
      })
      .select('id, micro_slug, title');

    if (upsertError) {
      return new Response(
        JSON.stringify({ 
          error: 'Upsert failed', 
          details: upsertError.message,
          hint: upsertError.hint 
        }),
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
