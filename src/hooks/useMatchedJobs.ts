import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import type { JobsBoardRow } from '@/pages/jobs/types';

/**
 * Hook to fetch matched jobs for the current professional user.
 * Uses the matched_jobs_for_professional view.
 */
export function useMatchedJobs() {
  const { user, activeRole } = useSession();

  const isProfessional = activeRole === 'professional';

  const query = useQuery({
    queryKey: ['matched_jobs', user?.id],
    queryFn: async (): Promise<JobsBoardRow[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('matched_jobs_for_professional')
        .select('*')
        .eq('professional_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      
      // Cast to JobsBoardRow (view has same shape)
      return (data ?? []) as unknown as JobsBoardRow[];
    },
    enabled: !!user?.id && isProfessional,
    staleTime: 30_000,
  });

  return {
    matchedJobs: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isProfessional,
  };
}
