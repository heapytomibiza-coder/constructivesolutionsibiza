import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { logJourneyEvent, JOURNEY_EVENTS } from "@/lib/journey";
import type { JobsBoardRow } from "../types";
import { jobKeys } from "./keys";

/**
 * Fetch matched jobs for a professional user.
 *
 * NOTE: Behaviour unchanged. The journey trace events emitted here are
 * diagnostic-only and wrapped in try/catch via logJourneyEvent itself —
 * they cannot affect query success or failure.
 */
export async function fetchMatchedJobs(userId: string, signal?: AbortSignal): Promise<JobsBoardRow[]> {
  logJourneyEvent(JOURNEY_EVENTS.MATCHING_START, {
    payload: { user_hash: userId.slice(0, 8) },
  });

  const query = supabase
    .from("matched_jobs_for_professional")
    .select("*")
    .eq("professional_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (signal) query.abortSignal(signal);

  const { data, error } = await query;

  if (error) {
    logJourneyEvent(JOURNEY_EVENTS.MATCHING_FAILURE, {
      success: false,
      errorMessage: error.message?.slice(0, 300),
      errorCode: (error as { code?: string }).code,
    });
    throw error;
  }

  const rows = (data ?? []) as unknown as JobsBoardRow[];
  if (rows.length === 0) {
    logJourneyEvent(JOURNEY_EVENTS.MATCHING_EMPTY, {
      payload: { count: 0 },
    });
  } else {
    logJourneyEvent(JOURNEY_EVENTS.MATCHING_SUCCESS, {
      payload: { count: rows.length },
    });
  }

  return rows;
}

/**
 * Hook to fetch matched jobs for the current professional user.
 * Uses the matched_jobs_for_professional view.
 */
export function useMatchedJobs() {
  const { user, activeRole } = useSession();
  const isProfessional = activeRole === "professional";

  const query = useQuery({
    queryKey: user?.id ? jobKeys.matched(user.id) : jobKeys.matchedNone(),
    queryFn: ({ signal }) => fetchMatchedJobs(user!.id, signal),
    enabled: !!user?.id && isProfessional,
    staleTime: 30_000,
  });

  // Mirror query-level error to journey trace (fetchMatchedJobs already
  // logs network/RPC errors; this catches react-query-side failures e.g.
  // retry exhaustion or thrown rejections that bypass the inline path).
  useEffect(() => {
    if (query.isError && query.error) {
      const err = query.error as { message?: string; code?: string };
      logJourneyEvent(JOURNEY_EVENTS.MATCHING_FAILURE, {
        success: false,
        errorMessage: err.message?.slice(0, 300) ?? "matching query failed",
        errorCode: err.code,
      });
    }
  }, [query.isError, query.error]);

  return {
    matchedJobs: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isProfessional,
  };
}
