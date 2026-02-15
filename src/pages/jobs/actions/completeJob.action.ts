import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/trackEvent';

/**
 * Mark a job as completed.
 * Only the job owner (client) can complete a job.
 * Requires an assigned professional.
 */
export async function completeJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // First fetch the job to verify ownership and assigned pro
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, user_id, assigned_professional_id, status')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: 'Job not found' };
  }

  // Must be job owner
  if (job.user_id !== user.id) {
    return { success: false, error: 'Not authorized' };
  }

  // Must have an assigned professional
  if (!job.assigned_professional_id) {
    return { success: false, error: 'Assign a professional before completing' };
  }

  // Must be in progress
  if (job.status !== 'in_progress') {
    return { success: false, error: 'Job must be in progress to complete' };
  }

  // Update job status to completed (include status check to prevent race/double-complete)
  const { data: updated, error } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error completing job:', error);
    return { success: false, error: error.message };
  }

  if (!updated) {
    return { success: false, error: 'Job already completed or status changed' };
  }

  trackEvent('job_completed', 'client', { jobId });

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
