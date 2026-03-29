import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch ranking labels for a professional via labels-only RPC.
 * Does NOT return numeric ranking_score — only labels.
 */
export function useProRanking(userId: string | null) {
  return useQuery<string[]>({
    queryKey: ['pro-ranking-labels', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_professional_labels' as any, {
        p_user_ids: [userId!],
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : null;
      return (row as any)?.labels ?? [];
    },
  });
}
