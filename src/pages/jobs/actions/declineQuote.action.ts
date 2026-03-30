/**
 * Decline (reject) a quote.
 * Only the job owner (client) can decline a quote.
 * RLS on quotes table already enforces ownership via jobs.user_id.
 */
import { supabase } from '@/integrations/supabase/client';

export async function declineQuote(
  quoteId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status: 'rejected' })
    .eq('id', quoteId)
    .eq('status', 'submitted')
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error declining quote:', error);
    return { success: false, error: error.message };
  }

  if (!data) {
    // Try revised status as well
    const { data: revised, error: err2 } = await supabase
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('id', quoteId)
      .eq('status', 'revised')
      .select('id')
      .maybeSingle();

    if (err2) return { success: false, error: err2.message };
    if (!revised) return { success: false, error: 'Quote already actioned or not found' };
  }

  return { success: true };
}
