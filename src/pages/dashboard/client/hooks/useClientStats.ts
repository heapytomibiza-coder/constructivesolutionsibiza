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

interface Job {
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
  conversation_count?: number;
}

export function useClientStats() {
  const { user } = useSession();

  const statsQuery = useQuery({
    queryKey: ['client_stats', user?.id],
    queryFn: async (): Promise<ClientStats> => {
      if (!user?.id) {
        return { activeJobs: 0, draftJobs: 0, totalJobs: 0, unreadMessages: 0, inProgressJobs: 0 };
      }

      // Fetch jobs count by status
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('user_id', user.id);

      if (jobsError) throw jobsError;

      const activeJobs = jobs?.filter(j => j.status === 'open').length || 0;
      const draftJobs = jobs?.filter(j => j.status === 'draft' || j.status === 'ready').length || 0;
      const inProgressJobs = jobs?.filter(j => j.status === 'in_progress').length || 0;
      const totalJobs = jobs?.length || 0;

      // Fetch unread messages using RPC
      const { data: conversations, error: convError } = await supabase
        .rpc('get_conversations_with_unread');

      if (convError) throw convError;

      const unreadMessages = conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;

      return {
        activeJobs,
        draftJobs,
        totalJobs,
        unreadMessages,
        inProgressJobs,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  const jobsQuery = useQuery({
    queryKey: ['client_jobs', user?.id],
    queryFn: async (): Promise<Job[]> => {
      if (!user?.id) return [];

      // Fetch jobs with metadata fields
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, status, category, subcategory, created_at, is_publicly_listed, assigned_professional_id, answers, area, budget_type, budget_value, budget_min, budget_max, start_timing')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      const jobs = data || [];

      // Fetch conversation counts for these jobs
      if (jobs.length > 0) {
        const jobIds = jobs.map(j => j.id);
        const { data: convos } = await supabase
          .from('conversations')
          .select('job_id')
          .in('job_id', jobIds);

        if (convos) {
          const countMap = new Map<string, number>();
          for (const c of convos) {
            countMap.set(c.job_id, (countMap.get(c.job_id) || 0) + 1);
          }
          return jobs.map(j => ({ ...j, conversation_count: countMap.get(j.id) || 0 }));
        }
      }

      return jobs.map(j => ({ ...j, conversation_count: 0 }));
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
