import { supabase } from '@/integrations/supabase/client';

export async function nudgeClient(conversationId: string) {
  const { data, error } = await supabase.rpc("admin_nudge_client", {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
  return data;
}

export async function suppressNudge(jobId: string) {
  const { error } = await supabase.rpc("suppress_nudge", {
    p_job_id: jobId,
    p_nudge_type: "conversation_stale",
  });
  if (error) throw error;
}
