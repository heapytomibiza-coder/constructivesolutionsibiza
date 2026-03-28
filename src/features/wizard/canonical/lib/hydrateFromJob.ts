/**
 * Hydrate WizardState from a saved job row.
 * Maps the stored `answers` JSON back into a WizardState for edit mode.
 */

import type { WizardState } from '../types';
import { EMPTY_WIZARD_STATE } from '../types';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface JobRow {
  id: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  micro_slug: string | null;
  answers: Json | null;
  status: string;
  user_id: string;
  is_custom_request?: boolean | null;
}

/** Statuses that allow editing */
const EDITABLE_STATUSES = ['draft', 'ready', 'open'];

export function canEditJob(status: string): boolean {
  return EDITABLE_STATUSES.includes(status);
}

/**
 * Fetch a job by ID (owner-checked via RLS) and hydrate WizardState.
 * Returns null if job not found, not owned, or not editable.
 */
export async function hydrateFromJob(jobId: string): Promise<{
  state: WizardState;
  jobRow: JobRow;
} | null> {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, title, category, subcategory, micro_slug, answers, status, user_id, is_custom_request')
    .eq('id', jobId)
    .single();

  if (error || !job) return null;
  if (!canEditJob(job.status)) return null;

  // Don't hard-fail when answers is null — default to {}
  const answers = (job.answers as Record<string, unknown> | null) ?? {};

  const selected = (answers.selected ?? {}) as Record<string, unknown>;
  const rawMicroAnswers = (answers.microAnswers ?? {}) as Record<string, Record<string, unknown>>;
  const logistics = (answers.logistics ?? {}) as Record<string, unknown>;
  const extras = (answers.extras ?? {}) as Record<string, unknown>;
  const custom = (answers.custom ?? {}) as Record<string, unknown>;

  // Detect custom request mode
  const isCustom =
    Boolean((job as any).is_custom_request) ||
    (typeof custom.jobTitle === 'string' && custom.jobTitle.trim().length > 0);

  // Look up category/subcategory IDs by name
  let mainCategoryId = '';
  let subcategoryId = '';

  const catName = (selected.mainCategory as string) || job.category || '';
  const subName = (selected.subcategory as string) || job.subcategory || '';

  if (catName) {
    const { data: cat } = await supabase
      .from('service_categories')
      .select('id')
      .eq('name', catName)
      .eq('is_active', true)
      .maybeSingle();
    if (cat) mainCategoryId = cat.id;
  }

  if (subName && mainCategoryId) {
    const { data: sub } = await supabase
      .from('service_subcategories')
      .select('id')
      .eq('name', subName)
      .eq('category_id', mainCategoryId)
      .eq('is_active', true)
      .maybeSingle();
    if (sub) subcategoryId = sub.id;
  }

  // Micros: fallback to job.micro_slug when selected.microSlugs is missing
  let microSlugs: string[] =
    (Array.isArray(selected.microSlugs) && (selected.microSlugs as string[])) ||
    (job.micro_slug ? [job.micro_slug] : []);

  let microIds: string[] = Array.isArray(selected.microIds) ? (selected.microIds as string[]) : [];
  let microNames: string[] = Array.isArray(selected.microNames) ? (selected.microNames as string[]) : [];

  // If we have slugs but no IDs/names, look them up
  if (microSlugs.length > 0 && (microIds.length === 0 || microNames.length === 0)) {
    const { data: micros } = await supabase
      .from('service_micro_categories')
      .select('id, name, slug')
      .in('slug', microSlugs)
      .eq('is_active', true);

    if (micros && micros.length > 0) {
      const bySlug = new Map(micros.map(m => [m.slug, m]));
      microIds = microSlugs.map(s => bySlug.get(s)?.id).filter(Boolean) as string[];
      microNames = microSlugs.map(s => bySlug.get(s)?.name).filter(Boolean) as string[];
    }
  }

  // Guard against invalid date strings
  const parseDate = (v: unknown): Date | undefined => {
    if (typeof v !== 'string' || !v) return undefined;
    // Date-only strings (YYYY-MM-DD): parse as local midnight to avoid UTC shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String).filter(Boolean) : [];

  const state: WizardState = {
    ...EMPTY_WIZARD_STATE,
    mainCategory: catName,
    mainCategoryId,
    subcategory: isCustom ? '' : subName,
    subcategoryId: isCustom ? '' : subcategoryId,
    microNames: isCustom ? [] : microNames,
    microIds: isCustom ? [] : microIds,
    microSlugs: isCustom ? [] : microSlugs,

    // Wizard mode
    wizardMode: isCustom ? 'custom' : 'structured',
    customRequest: isCustom ? {
      jobTitle: (custom.jobTitle as string) || job.title || '',
      description: (custom.description as string) || '',
      specs: (custom.specs as string) || undefined,
    } : undefined,

    // Canonical answers container
    answers: {
      microAnswers: rawMicroAnswers,
      _pack_source: (answers._pack_source as any) ?? undefined,
      _pack_slug: (answers._pack_slug as any) ?? undefined,
      _pack_missing: (answers._pack_missing as any) ?? undefined,
      ...(isCustom ? { custom } : {}),
    },
    logistics: {
      location: (logistics.location as string) || '',
      customLocation: (logistics.customLocation as string) || undefined,
      startDatePreset: (logistics.startDatePreset as string) || undefined,
      startDate: parseDate(logistics.startDate),
      completionDate: parseDate(logistics.completionDate),
      consultationType: (logistics.consultationType as WizardState['logistics']['consultationType']) || undefined,
      consultationDate: parseDate(logistics.consultationDate),
      consultationTime: (logistics.consultationTime as string) || undefined,
      budgetRange: (logistics.budgetRange as string) || undefined,
      accessDetails: toStringArray(logistics.accessDetails),
    },
    extras: {
      photos: toStringArray(extras.photos),
      notes: (extras.notes as string) || undefined,
      permitsConcern: (extras.permitsConcern as boolean) || undefined,
    },
  };

  return { state, jobRow: job as unknown as JobRow };
}
