import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';

/**
 * Mark a job as completed via secure RPC.
 * Only the job owner (client) can complete a job.
 * The RPC validates ownership, status, and assigned professional server-side.
 */
export async function completeJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('complete_job', { p_job_id: jobId });

  if (error) {
    console.error('Error completing job:', error);
    return { success: false, error: error.message };
  }

  trackEvent(EVENTS.JOB_COMPLETED, 'client', {}, { job_id: jobId });

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
