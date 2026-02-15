import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnansweredJob {
  id: string;
  title: string;
  category: string | null;
  area: string | null;
  budget_type: string | null;
  budget_value: number | null;
  created_at: string;
  hours_waiting: number;
  conversation_count: number;
}

export function useUnansweredJobs(hoursThreshold = 6) {
  return useQuery({
    queryKey: ["admin", "unanswered_jobs", hoursThreshold],
    queryFn: async (): Promise<UnansweredJob[]> => {
      const { data, error } = await supabase.rpc("admin_unanswered_jobs", {
        p_hours_threshold: hoursThreshold,
      });
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return (Array.isArray(parsed) ? parsed : []) as UnansweredJob[];
    },
    staleTime: 30_000,
  });
}
