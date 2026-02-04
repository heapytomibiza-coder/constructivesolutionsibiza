import { supabase } from '@/integrations/supabase/client';

/**
 * Mark a job as completed.
 * Only the job owner (client) can complete a job.
 */
export async function completeJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Update job status to completed
  const { error } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', user.id); // RLS + explicit check

  if (error) {
    console.error('Error completing job:', error);
    return { success: false, error: error.message };
  }

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
