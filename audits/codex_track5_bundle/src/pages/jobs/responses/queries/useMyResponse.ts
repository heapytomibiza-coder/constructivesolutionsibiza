/**
 * useMyResponse — pro-side query.
 *
 * Fetches the current professional's response row for a given job, if any.
 * Returns null when the pro has not engaged. RLS guarantees pros can only
 * see their own row.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { responseKeys } from "./keys";
import type { ResponseRow } from "../types";

export function useMyResponse(
  jobId: string | null,
  userId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey:
      jobId && userId ? responseKeys.mine(jobId, userId) : responseKeys.mineNone(),
    enabled: enabled && !!jobId && !!userId,
    queryFn: async (): Promise<ResponseRow | null> => {
      if (!jobId || !userId) return null;

      const { data, error } = await supabase
        .from("job_responses")
        .select("*")
        .eq("job_id", jobId)
        .eq("professional_id", userId)
        .maybeSingle();

      // Treat RLS denial as "no response" rather than crashing the action bar
      if (error) {
        if (error.code === "42501" || error.message?.includes("permission denied")) {
          return null;
        }
        throw error;
      }
      return (data as ResponseRow | null) ?? null;
    },
  });
}
