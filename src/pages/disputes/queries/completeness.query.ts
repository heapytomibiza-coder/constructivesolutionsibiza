import { supabase } from '@/integrations/supabase/client';

export interface CompletenessData {
  has_statement: boolean;
  has_questionnaire: boolean;
  evidence_count: number;
  has_counterparty_response: boolean;
  has_scope: boolean;
  score: number;
  max_score: number;
  level: 'low' | 'medium' | 'high';
}

export async function fetchDisputeCompleteness(disputeId: string): Promise<CompletenessData> {
  const { data, error } = await supabase.rpc('rpc_dispute_completeness', {
    p_dispute_id: disputeId,
  } as any);
  if (error) throw error;
  return data as unknown as CompletenessData;
}
