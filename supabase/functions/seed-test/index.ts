/**
 * seed-test - Safe seeding of question packs from V1 definitions
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { ALL_RAW_PACKS } from "../_shared/v1QuestionPacks.ts";

const SLUG_ALIASES: Record<string, string> = {
  'furniture-appliance-delivery': 'furniture-delivery',
  'skip-hire-delivery': 'skip-hire',
};

const humanize = (s: string): string =>
  s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

const getMicroSlug = (p: any): string => String(p.microSlug ?? p.slug ?? '').trim();
const getTitle = (p: any, microSlug: string): string => String(p.title ?? p.name ?? humanize(microSlug)).trim();

const normalizeQuestionType = (type: string): string => {
  const map: Record<string, string> = { 'single': 'radio', 'multi': 'checkbox', 'yesno': 'radio' };
  return map[type] ?? type;
};

const normalizeQuestion = (q: any) => ({
  id: String(q.id ?? q.key ?? '').trim(),
  label: String(q.label ?? q.question ?? '').trim(),
  type: normalizeQuestionType(String(q.type ?? '').trim()),
  options: q.options,
  required: q.required,
  placeholder: q.placeholder,
  help: q.help ?? q.helpText,
  accept: q.accept,
});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const dryRun = new URL(req.url).searchParams.get('dry_run') === '1';

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    const normalizedPacks = ALL_RAW_PACKS.map((p: any) => {
      const rawSlug = getMicroSlug(p);
      const micro_slug = SLUG_ALIASES[rawSlug] ?? rawSlug;
      return { micro_slug, title: getTitle(p, micro_slug), questions: (p.questions || []).map(normalizeQuestion), is_active: true, version: 1 };
    });

    const { data: existingMicros } = await supabase.from('service_micro_categories').select('slug').eq('is_active', true);
    const validSlugsSet = new Set((existingMicros || []).map((m: any) => m.slug));
    const missingSlugs = normalizedPacks.map(p => p.micro_slug).filter(s => !validSlugsSet.has(s));
    const packsToInsert = normalizedPacks.filter(p => validSlugsSet.has(p.micro_slug));

    if (dryRun) {
      return new Response(JSON.stringify({
        mode: 'dry_run', rawPackCount: ALL_RAW_PACKS.length, validPackCount: packsToInsert.length,
        missingSlugsCount: missingSlugs.length, missingSlugs: missingSlugs.slice(0, 30),
        sample: packsToInsert[0] ? { micro_slug: packsToInsert[0].micro_slug, title: packsToInsert[0].title, questionCount: packsToInsert[0].questions.length } : null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: upserted, error } = await supabase.from('question_packs').upsert(packsToInsert, { onConflict: 'micro_slug' }).select('micro_slug');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ success: true, inserted: upserted?.length, skipped: missingSlugs.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
