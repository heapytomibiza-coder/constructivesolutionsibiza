import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobDetailsRow } from "../types";
import { jobKeys } from "./keys";

/**
 * Fetch job details by ID from the job_details view.
 */
export async function fetchJobDetails(jobId: string): Promise<JobDetailsRow> {
  const { data, error } = await supabase
    .from("job_details")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) throw error;
  return data as unknown as JobDetailsRow;
}

/**
 * Hook to fetch job details.
 * @param jobId - The job ID to fetch
 * @param enabled - Whether the query should run (default: true)
 */
export function useJobDetails(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: jobId ? jobKeys.details(jobId) : jobKeys.detailsNone(),
    queryFn: async () => {
      if (!jobId) throw new Error("jobId required");
      return fetchJobDetails(jobId);
    },
    enabled: enabled && !!jobId,
    staleTime: 30_000,
  });
}
