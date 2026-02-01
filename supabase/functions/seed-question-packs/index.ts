/**
 * seed-question-packs - Safe seeding of question packs from V1 definitions
 * 
 * Safety features:
 * - Dry-run mode (?dry_run=1) - validates without writing
 * - Slug validation - fails fast if any micro_slug doesn't exist in taxonomy
 * - Upsert on micro_slug - prevents duplicates
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

// Question pack definition matching V1 format
interface QuestionOption {
  value: string;
  label: string;
}

interface QuestionDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  options?: (string | QuestionOption)[];
  required?: boolean;
  placeholder?: string;
}

interface QuestionPackInput {
  slug?: string;        // V1 format uses 'slug'
  microSlug?: string;   // Alternative key
  title: string;
  questions: QuestionDef[];
}

interface ValidationResult {
  valid: boolean;
  packCount: number;
  validSlugs: string[];
  missingSlugs: string[];
  errors: string[];
}

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

    // Normalize slugs (support both 'slug' and 'microSlug' keys)
    const normalizedPacks = packs.map(p => ({
      micro_slug: p.slug || p.microSlug || '',
      title: p.title,
      questions: p.questions,
    }));

    const inputSlugs = normalizedPacks.map(p => p.micro_slug).filter(Boolean);
    
    if (inputSlugs.length !== normalizedPacks.length) {
      return new Response(
        JSON.stringify({ 
          error: 'Some packs are missing slug/microSlug',
          packCount: packs.length,
          slugCount: inputSlugs.length 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active micro slugs from taxonomy
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

    // If dry run or validation failed, return validation result
    if (dryRun || !validation.valid) {
      return new Response(
        JSON.stringify({
          mode: dryRun ? 'dry_run' : 'validation_failed',
          ...validation,
          message: dryRun 
            ? `Dry run complete. ${validation.valid ? 'Ready to insert.' : 'Fix missing slugs first.'}`
            : `Aborted: ${missingSlugs.length} unknown slug(s). No data was written.`,
        }),
        { 
          status: validation.valid ? 200 : 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Perform upsert
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
