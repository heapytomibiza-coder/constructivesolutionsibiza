import { supabase } from '@/integrations/supabase/client';

interface AwardProStatsParams {
  professionalUserId: string;
  microIds: string[];
  rating?: number | null;
}

/**
 * Award stats to a professional for completed job micros.
 * Should be called when a CLIENT reviews a PROFESSIONAL (not the other way around).
 * This drives the verification ladder: unverified → progressing → verified → expert
 * 
 * Idempotency: The review insert has a unique constraint (job_id + reviewer_user_id),
 * so this function will only be called once per job-review pair.
 */
export async function awardProStats({
  professionalUserId,
  microIds,
  rating,
}: AwardProStatsParams): Promise<{ success: boolean; error?: string }> {
  if (!professionalUserId || microIds.length === 0) {
    return { success: true }; // No-op, not an error
  }

  try {
    // Call RPC for each micro (they're independent skill tracks)
    for (const microId of microIds) {
      const { error } = await supabase.rpc('increment_professional_micro_stats', {
        p_user_id: professionalUserId,
        p_micro_id: microId,
        p_rating: rating ?? undefined, // undefined = null in RPC
      });

      if (error) {
        console.error(`Failed to award stats for micro ${microId}:`, error);
        // Continue with other micros even if one fails
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error awarding pro stats:', err);
    return { success: false, error: 'Failed to update professional stats' };
  }
}
