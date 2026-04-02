import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/trackEvent';

/**
 * Assign a professional to a job and set status to in_progress.
 * Only the job owner (client) can assign.
 * Security: professional must be a conversation participant on this job.
 */

// Accept multiple status names until DB is fully normalized
const ASSIGNABLE_STATUSES = ['open', 'posted'] as const;

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

  // Accept 'open' or 'posted' status
  if (!ASSIGNABLE_STATUSES.includes(job.status as typeof ASSIGNABLE_STATUSES[number])) {
    return { success: false, error: 'Job must be open to assign a professional' };
  }

  // Security: Verify the professional is a conversation participant for this job
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('job_id', jobId)
    .eq('pro_id', professionalId)
    .maybeSingle();

  if (convError) {
    console.error('Error verifying conversation:', convError);
    return { success: false, error: 'Unable to verify conversation participant' };
  }

  if (!conversation) {
    return { success: false, error: 'Professional has not messaged about this job' };
  }

  // Gate: require a submitted/revised quote before hiring
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id')
    .eq('job_id', jobId)
    .eq('professional_id', professionalId)
    .in('status', ['submitted', 'revised'])
    .maybeSingle();

  if (quoteError) {
    console.error('Error checking quote:', quoteError);
    return { success: false, error: 'Unable to verify quote' };
  }

  if (!quote) {
    return { success: false, error: 'A quote is required before hiring this professional' };
  }

  // Atomic update: only succeeds if still unassigned + in assignable status
  const { data, error } = await supabase
    .from('jobs')
    .update({
      assigned_professional_id: professionalId,
      status: 'in_progress',
    })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .in('status', [...ASSIGNABLE_STATUSES])
    .is('assigned_professional_id', null)
    .select('id')
    .single();

  if (error) {
    console.error('Error assigning professional:', error);
    return { success: false, error: error.message };
  }

  // No rows updated means race condition or status changed
  if (!data) {
    return { success: false, error: 'Job could not be assigned (it may have changed)' };
  }

  trackEvent('hire_initiated', 'client', { pro_id: professionalId }, { job_id: jobId });

  return { success: true };
}
