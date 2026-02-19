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
    .select('id, title, category, subcategory, micro_slug, answers, status, user_id')
    .eq('id', jobId)
    .single();

  if (error || !job) return null;
  if (!canEditJob(job.status)) return null;

  const answers = job.answers as Record<string, unknown> | null;
  if (!answers) {
    // Job has no answers JSON — can't hydrate wizard meaningfully
    return null;
  }

  const selected = (answers.selected ?? {}) as Record<string, unknown>;
  const microAnswers = (answers.microAnswers ?? {}) as Record<string, unknown>;
  const logistics = (answers.logistics ?? {}) as Record<string, unknown>;
  const extras = (answers.extras ?? {}) as Record<string, unknown>;

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

  // Parse date strings back to Date objects
  const parseDate = (v: unknown): Date | undefined => {
    if (typeof v === 'string' && v) return new Date(v);
    return undefined;
  };

  const state: WizardState = {
    ...EMPTY_WIZARD_STATE,
    mainCategory: catName,
    mainCategoryId,
    subcategory: subName,
    subcategoryId,
    microNames: (selected.microNames as string[]) || [],
    microIds: (selected.microIds as string[]) || [],
    microSlugs: (selected.microSlugs as string[]) || [],
    answers: microAnswers,
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
      accessDetails: (logistics.accessDetails as string[]) || [],
    },
    extras: {
      photos: (extras.photos as string[]) || [],
      notes: (extras.notes as string) || undefined,
      permitsConcern: (extras.permitsConcern as boolean) || undefined,
    },
  };

  return { state, jobRow: job as unknown as JobRow };
}
