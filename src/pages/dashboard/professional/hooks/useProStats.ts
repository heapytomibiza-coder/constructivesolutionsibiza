import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { normalizePhase, phaseIndex, type CanonicalPhase } from '@/pages/onboarding/lib/phaseProgression';

/**
 * Dashboard stages — derived from session + stats, drives the hero card & menu gating.
 */
export type DashboardStage =
  | 'needs_profile'    // no display name yet
  | 'needs_services'   // profile exists but 0 services
  | 'needs_review'     // services set but onboarding not complete
  | 'needs_visibility' // complete but not publicly listed
  | 'active';          // live and visible

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

function deriveDashboardStage(
  displayName: string | null | undefined,
  servicesCount: number,
  phase: string | null | undefined,
  isPubliclyListed: boolean,
): DashboardStage {
  if (!displayName || displayName.trim().length === 0) return 'needs_profile';
  if (servicesCount === 0) return 'needs_services';
  const normalized = normalizePhase(phase);
  if (phaseIndex(normalized) < phaseIndex('complete' as CanonicalPhase)) return 'needs_review';
  if (!isPubliclyListed) return 'needs_visibility';
  return 'active';
}

export function useProStats() {
  const { user, professionalProfile } = useSession();
  const servicesCount = professionalProfile?.servicesCount ?? 0;
  const businessName = professionalProfile?.businessName ?? null;

  // Fetch bio + tagline (not on session context)
  const profileExtrasQuery = useQuery({
    queryKey: ['pro_profile_extras', user?.id],
    queryFn: async () => {
      if (!user?.id) return { bio: null, tagline: null };
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('bio, tagline')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return { bio: data?.bio ?? null, tagline: data?.tagline ?? null };
    },
    enabled: !!user?.id,
    staleTime: 120000,
  });

  const dashboardStage = deriveDashboardStage(
    professionalProfile?.displayName,
    servicesCount,
    professionalProfile?.onboardingPhase,
    professionalProfile?.isPubliclyListed ?? false,
  );

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
    staleTime: 60000,
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
  });

  const stats: ProStats = {
    servicesCount,
    matchedJobsCount: matchedJobsQuery.data?.length || 0,
    unreadMessages: unreadQuery.data || 0,
  };

  return {
    stats,
    dashboardStage,
    matchedJobs: matchedJobsQuery.data || [],
    bio: profileExtrasQuery.data?.bio ?? null,
    tagline: profileExtrasQuery.data?.tagline ?? null,
    businessName,
    isLoading: matchedJobsQuery.isLoading || unreadQuery.isLoading,
    error: matchedJobsQuery.error || unreadQuery.error,
    refetch: () => {
      matchedJobsQuery.refetch();
      unreadQuery.refetch();
    },
  };
}
