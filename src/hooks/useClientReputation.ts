import { useQuery } from '@tanstack/react-query';
import { clientReputationTable } from '@/lib/supabaseTyped';
import type { ClientReputationRow } from '@/lib/supabaseTyped';

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
      const { data, error } = await clientReputationTable()
        .select('score, badges, completion_rate, review_rate, dispute_rate, total_jobs, completed_jobs')
        .eq('user_id', clientId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as ClientReputationRow;
      return {
        score: row.score,
        badges: row.badges ?? [],
        completionRate: row.completion_rate,
        reviewRate: row.review_rate,
        disputeRate: row.dispute_rate,
        totalJobs: row.total_jobs,
        completedJobs: row.completed_jobs,
      };
    },
  });
}
