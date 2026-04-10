import { supabase } from '@/integrations/supabase/client';

const RPC_ERROR_MAP: Record<string, string> = {
  job_not_found: 'Job not found',
  not_authorized: 'Not authorized',
  job_not_in_progress: 'Job must be in progress to complete',
  no_professional_assigned: 'Assign a professional before completing',
  already_requested: 'Completion already requested',
};

/**
 * Professional requests job completion — triggers client confirmation flow.
 */
export async function requestCompletion(jobId: string) {
  const { error } = await supabase.rpc('request_job_completion', { p_job_id: jobId });

  if (error) {
    const friendlyMsg = RPC_ERROR_MAP[error.message] ?? error.message;
    return { success: false as const, error: friendlyMsg };
  }
  return { success: true as const };
}
