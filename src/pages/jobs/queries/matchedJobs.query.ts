import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import type { JobsBoardRow } from "../types";
import { jobKeys } from "./keys";

/**
 * Fetch matched jobs for a professional user.
 */
export async function fetchMatchedJobs(userId: string): Promise<JobsBoardRow[]> {
  const { data, error } = await supabase
    .from("matched_jobs_for_professional")
    .select("*")
    .eq("professional_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as unknown as JobsBoardRow[];
}

/**
 * Hook to fetch matched jobs for the current professional user.
 * Uses the matched_jobs_for_professional view.
 */
export function useMatchedJobs() {
  const { user, activeRole } = useSession();
  const isProfessional = activeRole === "professional";

  const query = useQuery({
    queryKey: user?.id ? jobKeys.matched(user.id) : ["matched_jobs", "none"],
    queryFn: () => fetchMatchedJobs(user!.id),
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
