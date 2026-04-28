import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logJourneyEvent, JOURNEY_EVENTS } from "@/lib/journey";
import type { JobDetailsRow } from "../types";
import { jobKeys } from "./keys";

/**
 * Fetch job details by ID from the job_details view.
 *
 * NOTE: Behaviour unchanged. Journey trace events are diagnostic-only
 * and never throw or block.
 */
export async function fetchJobDetails(jobId: string): Promise<JobDetailsRow> {
  logJourneyEvent(JOURNEY_EVENTS.JOBS_LOAD_START, {
    action: "job_details",
    payload: { job_id_hash: jobId.slice(0, 8) },
  });

  const { data, error } = await supabase
    .from("job_details")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    logJourneyEvent(JOURNEY_EVENTS.JOBS_LOAD_FAILURE, {
      action: "job_details",
      success: false,
      errorMessage: error.message?.slice(0, 300),
      errorCode: (error as { code?: string }).code,
    });
    throw error;
  }

  logJourneyEvent(JOURNEY_EVENTS.JOBS_LOAD_SUCCESS, {
    action: "job_details",
  });

  return data as unknown as JobDetailsRow;
}

/**
 * Hook to fetch job details.
 * @param jobId - The job ID to fetch
 * @param enabled - Whether the query should run (default: true)
 */
export function useJobDetails(jobId: string | null, enabled = true) {
  const query = useQuery({
    queryKey: jobId ? jobKeys.details(jobId) : jobKeys.detailsNone(),
    queryFn: async () => {
      if (!jobId) throw new Error("jobId required");
      return fetchJobDetails(jobId);
    },
    enabled: enabled && !!jobId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      const err = query.error as { message?: string; code?: string };
      logJourneyEvent(JOURNEY_EVENTS.JOBS_LOAD_FAILURE, {
        action: "job_details",
        success: false,
        errorMessage: err.message?.slice(0, 300) ?? "job details query failed",
        errorCode: err.code,
      });
    }
  }, [query.isError, query.error]);

  return query;
}
