import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LatestJob {
  id: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  area: string | null;
  budget_type: string | null;
  budget_value: number | null;
  budget_min: number | null;
  budget_max: number | null;
  start_timing: string | null;
  created_at: string;
}

export function useLatestJobs(limit = 10) {
  return useQuery({
    queryKey: ["admin", "latest_jobs", limit],
    queryFn: async (): Promise<LatestJob[]> => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, category, subcategory, area, budget_type, budget_value, budget_min, budget_max, start_timing, created_at")
        .eq("status", "open")
        .eq("is_publicly_listed", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as LatestJob[];
    },
    staleTime: 30_000,
  });
}
