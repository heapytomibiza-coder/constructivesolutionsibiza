import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';

/** Friendly error messages keyed by RPC exception text */
const RPC_ERROR_MAP: Record<string, string> = {
  job_not_found: 'Job not found.',
  not_authorized: 'Only the client who posted this job can confirm completion.',
  job_not_in_progress: 'Job must be in progress to complete.',
  no_professional_assigned: 'A professional must be assigned before completing.',
  completion_not_requested: 'The professional must request completion first.',
};

function friendlyError(raw: string): string {
  for (const [key, msg] of Object.entries(RPC_ERROR_MAP)) {
    if (raw.includes(key)) return msg;
  }
  return raw;
}

/**
 * Mark a job as completed via secure RPC.
 * Only the job owner (client) can complete a job.
 * The RPC validates ownership, status, and assigned professional server-side.
 */
export async function completeJob(
  jobId: string,
  debugCtx?: { caller?: string; userId?: string; jobOwnerId?: string; assignedProId?: string; jobStatus?: string; completionRequestedAt?: string | null },
): Promise<{ success: boolean; error?: string }> {
  if (debugCtx) {
    console.info('[completeJob] attempt', debugCtx);
  }

  const { error } = await supabase.rpc('complete_job', { p_job_id: jobId });

  if (error) {
    const friendly = friendlyError(error.message);
    console.error('[completeJob] RPC rejected:', { raw: error.message, friendly, jobId });
    return { success: false, error: friendly };
  }

  trackEvent(EVENTS.JOB_COMPLETED, 'client', {}, { job_id: jobId });
  console.info('[completeJob] success', { jobId });

  return { success: true };
}

/**
 * Get the assigned professional for a job.
 */
export async function getJobAssignedPro(jobId: string): Promise<{
  assignedProId: string | null;
  jobOwnerId: string | null;
}> {
  const { data, error } = await supabase
    .from('jobs')
    .select('assigned_professional_id, user_id')
    .eq('id', jobId)
    .single();

  if (error || !data) {
    return { assignedProId: null, jobOwnerId: null };
  }

  return {
    assignedProId: data.assigned_professional_id,
    jobOwnerId: data.user_id,
  };
}
