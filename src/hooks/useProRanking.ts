import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProRanking {
  userId: string;
  rankingScore: number;
  labels: string[];
}

/**
 * Fetch ranking labels for a professional.
 * Used to display trust labels on cards/profiles.
 */
export function useProRanking(userId: string | null) {
  return useQuery<ProRanking | null>({
    queryKey: ['pro-ranking', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_rankings' as any)
        .select('user_id, ranking_score, labels')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        userId: (data as any).user_id,
        rankingScore: Number((data as any).ranking_score ?? 0),
        labels: (data as any).labels ?? [],
      };
    },
  });
}
