/**
 * useJobResponseCount — lightweight count of "live" responses for a job.
 *
 * Live = interested | quoted | shortlisted (excludes accepted/declined/
 * withdrawn/expired). Used to render the entry-point badge from the Job
 * Ticket without pulling the full enriched inbox payload.
 *
 * RLS still authoritative — the query returns 0 if the caller isn't allowed.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { responseKeys } from "./keys";

const LIVE_STATUSES = ["interested", "quoted", "shortlisted"] as const;

export function useJobResponseCount(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: jobId
      ? [...responseKeys.forJob(jobId), "count"]
      : ["responses", "job", "none", "count"],
    enabled: enabled && !!jobId,
    queryFn: async (): Promise<number> => {
      if (!jobId) return 0;
      const { count, error } = await supabase
        .from("job_responses")
        .select("id", { count: "exact", head: true })
        .eq("job_id", jobId)
        .in("status", LIVE_STATUSES as unknown as string[]);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });
}
