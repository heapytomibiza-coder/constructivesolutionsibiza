import { supabase } from '@/integrations/supabase/client';

export async function respondToResolution(params: {
  disputeId: string;
  accept: boolean;
  reason?: string;
}) {
  const { error } = await supabase.rpc('rpc_respond_to_resolution', {
    p_dispute_id: params.disputeId,
    p_accept: params.accept,
    p_rejection_reason: params.reason ?? null,
  });
  if (error) throw error;
}
