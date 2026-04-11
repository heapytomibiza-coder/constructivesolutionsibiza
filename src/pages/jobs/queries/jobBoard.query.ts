import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobsBoardRow } from "../types";
import { jobKeys } from "./keys";

/**
 * Fetch all publicly listed open jobs for the job board.
 */
export async function fetchJobsBoard(signal?: AbortSignal): Promise<JobsBoardRow[]> {
  const query = supabase
    .from("jobs_board")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (signal) query.abortSignal(signal);

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as unknown as JobsBoardRow[];
}

/**
 * Hook to fetch the jobs board.
 */
export function useJobsBoard() {
  return useQuery({
    queryKey: jobKeys.board(),
    queryFn: ({ signal }) => fetchJobsBoard(signal),
    staleTime: 30_000,
  });
}
