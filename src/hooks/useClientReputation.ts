import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientReputation {
  score: number;
  badges: string[];
  completionRate: number;
  reviewRate: number;
  disputeRate: number;
  totalJobs: number;
  completedJobs: number;
}

const BADGE_LABELS: Record<string, { labelKey: string; icon: string }> = {
  reliable_client: { labelKey: 'badges.reliableClient', icon: '✅' },
  fast_responder: { labelKey: 'badges.fastResponder', icon: '⚡' },
  consistent_reviewer: { labelKey: 'badges.consistentReviewer', icon: '⭐' },
};

export { BADGE_LABELS };

/**
 * Fetch client reputation data. Only accessible to:
 * - the client themselves
 * - pros who have conversations/jobs with the client
 * - admins
 */
export function useClientReputation(clientId: string | null) {
  return useQuery<ClientReputation | null>({
    queryKey: ['client-reputation', clientId],
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_reputation' as any)
        .select('score, badges, completion_rate, review_rate, dispute_rate, total_jobs, completed_jobs')
        .eq('user_id', clientId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        score: (data as any).score,
        badges: (data as any).badges ?? [],
        completionRate: (data as any).completion_rate,
        reviewRate: (data as any).review_rate,
        disputeRate: (data as any).dispute_rate,
        totalJobs: (data as any).total_jobs,
        completedJobs: (data as any).completed_jobs,
      };
    },
  });
}
