import { supabase } from '@/integrations/supabase/client';

export async function analyzeDispute(disputeId: string) {
  const { data, error } = await supabase.functions.invoke('analyze-dispute', {
    body: { dispute_id: disputeId },
  });

  if (error) throw error;
  return data.analysis;
}
