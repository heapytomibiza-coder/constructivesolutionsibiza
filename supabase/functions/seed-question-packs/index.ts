/**
 * seed-question-packs - Safe seeding of question packs from V1 definitions
 * 
 * Safety features:
 * - Secret auth required (Authorization: Bearer SEEDER_SECRET)
 * - Dry-run mode (?dry_run=1) - validates without writing
 * - Category targeting (?category=hvac or ?category=all)
 * - Slug validation - fails fast if any micro_slug doesn't exist in service_micro_categories
 * - Upsert on micro_slug - prevents duplicates
 * - Field normalization - handles V1 format differences (question→label, name→title)
 * 
 * Usage:
 *   POST /seed-question-packs?dry_run=1&category=all  → validate only
 *   POST /seed-question-packs?category=hvac           → insert/update packs for hvac
 *   POST /seed-question-packs?category=all            → insert/update all packs
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ Auth Helper ============

/**
 * Require SEEDER_SECRET for production safety.
 * Dev bypass: set ALLOW_OPEN_SEED=true in env to skip auth (never in production).
 */
function assertSeederAuth(req: Request): void {
  const expected = Deno.env.get('SEEDER_SECRET');
  const allowOpenSeed = Deno.env.get('ALLOW_OPEN_SEED') === 'true';

  // If no secret configured...
  if (!expected) {
    // Allow open seeding ONLY if explicitly enabled (dev environments)
    if (allowOpenSeed) {
      console.warn('[seed-question-packs] Running without SEEDER_SECRET (ALLOW_OPEN_SEED=true)');
      return;
    }
    // Otherwise fail safe
    const err = new Error('SEEDER_SECRET not configured. Set it or enable ALLOW_OPEN_SEED=true for dev.');
    (err as Error & { statusCode: number }).statusCode = 500;
    throw err;
  }

  // Secret is configured - validate the token
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (token !== expected) {
    const err = new Error('Unauthorized');
    (err as Error & { statusCode: number }).statusCode = 401;
    throw err;
  }
}

// ============ Slug Aliases ============
// Remap V1 slugs to V2 equivalents where they're genuinely the same service
const SLUG_ALIASES: Record<string, string> = {
  'furniture-appliance-delivery': 'furniture-delivery',
  'skip-hire-delivery': 'skip-hire',
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
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file';
  options?: unknown[];
  helpText?: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  accept?: string; // for file type (e.g., 'image/*,video/*')
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
  show_if?: unknown;
}

interface V2Question {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file';
  options?: unknown[];
  help?: string;
  placeholder?: string;
  required?: boolean;
  accept?: string; // for file type
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

    // Preserve placeholder, required, and accept (for file type)
    if (q.placeholder) normalized.placeholder = q.placeholder;
    if (q.required !== undefined) normalized.required = q.required;
    if (q.accept) normalized.accept = q.accept;

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

  // Auth check
  try {
    assertSeederAuth(req);
  } catch (err) {
    const statusCode = (err as Error & { statusCode?: number }).statusCode || 500;
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === '1';
  const category = (url.searchParams.get('category') || 'all').toLowerCase();

  // Validate category param
  if (!/^[a-z0-9_-]+$/.test(category)) {
    return new Response(
      JSON.stringify({ error: 'Invalid category parameter. Use alphanumeric, dashes, or underscores.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

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

    // Normalize packs with proper field mapping + apply slug aliases
    const aliasesApplied: { from: string; to: string }[] = [];
    
    const normalizedPacks = packs.map(p => {
      const rawSlug = p.slug || p.microSlug || '';
      const micro_slug = SLUG_ALIASES[rawSlug] ?? rawSlug;
      
      // Track if an alias was applied
      if (SLUG_ALIASES[rawSlug]) {
        aliasesApplied.push({ from: rawSlug, to: micro_slug });
      }
      
      return {
        micro_slug,
        original_slug: rawSlug !== micro_slug ? rawSlug : undefined,
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
          aliasesApplied: aliasesApplied.length,
          aliasPairs: aliasesApplied,
          taxonomySlugsAvailable: existingMicros?.length || 0,
          sampleNormalizedPack: samplePack ? {
            micro_slug: samplePack.micro_slug,
            original_slug: samplePack.original_slug,
            title: samplePack.title,
            questionCount: samplePack.questions.length,
            firstQuestion: samplePack.questions[0] || null,
          } : null,
          message: validation.valid 
            ? `Dry run complete. ${validation.packCount} pack(s) ready to insert. ${aliasesApplied.length} alias(es) applied.`
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
