import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

interface ProStats {
  servicesCount: number;
  matchedJobsCount: number;
  unreadMessages: number;
}

interface MatchedJob {
  id: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  micro_slug: string | null;
  area: string | null;
  budget_type: string | null;
  budget_value: number | null;
  budget_min: number | null;
  budget_max: number | null;
  start_timing: string | null;
  created_at: string;
  teaser: string | null;
  highlights: string[] | null;
}

export function useProStats() {
  const { user } = useSession();
  const { servicesCount } = useProfessionalServices();

  const matchedJobsQuery = useQuery({
    queryKey: ['matched_jobs', user?.id],
    queryFn: async (): Promise<MatchedJob[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('matched_jobs_for_professional')
        .select('*')
        .eq('professional_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const unreadQuery = useQuery({
    queryKey: ['pro_unread_messages', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { data: conversations, error } = await supabase
        .rpc('get_conversations_with_unread');

      if (error) throw error;
      return conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const stats: ProStats = {
    servicesCount,
    matchedJobsCount: matchedJobsQuery.data?.length || 0,
    unreadMessages: unreadQuery.data || 0,
  };

  return {
    stats,
    matchedJobs: matchedJobsQuery.data || [],
    isLoading: matchedJobsQuery.isLoading || unreadQuery.isLoading,
    error: matchedJobsQuery.error || unreadQuery.error,
    refetch: () => {
      matchedJobsQuery.refetch();
      unreadQuery.refetch();
    },
  };
}
