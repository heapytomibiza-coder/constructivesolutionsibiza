import { supabase } from '@/integrations/supabase/client';

export async function respondToCancellation(jobId: string, accept: boolean) {
  const { error } = await supabase.rpc('respond_to_cancellation', {
    p_job_id: jobId,
    p_accept: accept,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }
  return { success: true as const };
}
