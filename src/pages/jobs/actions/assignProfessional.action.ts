import { supabase } from '@/integrations/supabase/client';

/**
 * Assign a professional to a job and set status to in_progress.
 * Only the job owner (client) can assign.
 * MVP: Used for testing the completion flow.
 */
export async function assignProfessional(
  jobId: string, 
  professionalId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify job ownership and current status
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, user_id, status, assigned_professional_id')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    return { success: false, error: 'Job not found' };
  }

  if (job.user_id !== user.id) {
    return { success: false, error: 'Not authorized' };
  }

  if (job.assigned_professional_id) {
    return { success: false, error: 'Job already has an assigned professional' };
  }

  if (job.status !== 'open') {
    return { success: false, error: 'Job must be open to assign a professional' };
  }

  // Update job with assigned pro and set to in_progress
  const { error } = await supabase
    .from('jobs')
    .update({
      assigned_professional_id: professionalId,
      status: 'in_progress',
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .eq('status', 'open');

  if (error) {
    console.error('Error assigning professional:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
