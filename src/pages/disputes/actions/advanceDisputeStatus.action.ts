import { supabase } from '@/integrations/supabase/client';

export async function advanceDisputeStatus(disputeId: string, newStatus: string) {
  const { data, error } = await supabase.rpc('rpc_advance_dispute_status', {
    p_dispute_id: disputeId,
    p_new_status: newStatus,
  } as any);

  if (error) throw error;
  return data;
}
