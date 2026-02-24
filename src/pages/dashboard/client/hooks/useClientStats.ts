import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

interface ClientStats {
  activeJobs: number;
  draftJobs: number;
  totalJobs: number;
  unreadMessages: number;
  inProgressJobs: number;
}

export interface ClientJob {
  id: string;
  title: string;
  status: string;
  category: string | null;
  subcategory: string | null;
  created_at: string;
  is_publicly_listed: boolean;
  assigned_professional_id: string | null;
  answers?: unknown;
  area: string | null;
  budget_type: string | null;
  budget_value: number | null;
  budget_min: number | null;
  budget_max: number | null;
  start_timing: string | null;
  conversation_count: number;
}

export function useClientStats() {
  const { user } = useSession();

  const statsQuery = useQuery({
    queryKey: ['client_stats', user?.id],
    queryFn: async (): Promise<ClientStats> => {
      if (!user?.id) {
        return { activeJobs: 0, draftJobs: 0, totalJobs: 0, unreadMessages: 0, inProgressJobs: 0 };
      }

      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('user_id', user.id);

      if (jobsError) throw jobsError;

      const activeJobs = jobs?.filter(j => j.status === 'open').length || 0;
      const draftJobs = jobs?.filter(j => j.status === 'draft' || j.status === 'ready').length || 0;
      const inProgressJobs = jobs?.filter(j => j.status === 'in_progress').length || 0;
      const totalJobs = jobs?.length || 0;

      const { data: conversations, error: convError } = await supabase
        .rpc('get_conversations_with_unread');

      if (convError) throw convError;

      const unreadMessages = conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;

      return { activeJobs, draftJobs, totalJobs, unreadMessages, inProgressJobs };
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const jobsQuery = useQuery({
    queryKey: ['client_jobs', user?.id],
    queryFn: async (): Promise<ClientJob[]> => {
      if (!user?.id) return [];

      // Fetch jobs with extra fields
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, title, status, category, subcategory, created_at, is_publicly_listed, assigned_professional_id, answers, area, budget_type, budget_value, budget_min, budget_max, start_timing')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!jobs?.length) return [];

      // Fetch conversation counts via RPC (fast, RLS-safe)
      const jobIds = jobs.map(j => j.id);
      const { data: convCounts } = await supabase
        .rpc('get_conversation_counts_for_jobs', { p_job_ids: jobIds });

      const countMap = new Map<string, number>();
      convCounts?.forEach((c: { job_id: string; conversation_count: number }) => {
        countMap.set(c.job_id, Number(c.conversation_count));
      });

      return jobs.map(j => ({
        ...j,
        conversation_count: countMap.get(j.id) || 0,
      }));
    },
    enabled: !!user?.id,
  });

  return {
    stats: statsQuery.data || { activeJobs: 0, draftJobs: 0, totalJobs: 0, unreadMessages: 0, inProgressJobs: 0 },
    jobs: jobsQuery.data || [],
    isLoading: statsQuery.isLoading || jobsQuery.isLoading,
    error: statsQuery.error || jobsQuery.error,
    refetch: () => {
      statsQuery.refetch();
      jobsQuery.refetch();
    },
  };
}
