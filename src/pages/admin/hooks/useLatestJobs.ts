import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

type NewJobCallback = (job: LatestJob) => void;

export function useLatestJobs(limit = 10, onNewJob?: NewJobCallback) {
  const queryClient = useQueryClient();
  const onNewJobRef = useRef(onNewJob);
  onNewJobRef.current = onNewJob;

  useEffect(() => {
    const channel = supabase
      .channel("admin-jobs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "jobs" },
        (payload) => {
          const row = payload.new as any;
          if (row?.status !== "open" || row?.is_publicly_listed !== true) return;

          queryClient.invalidateQueries({ queryKey: ["admin", "latest_jobs"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });

          if (onNewJobRef.current) {
            onNewJobRef.current({
              id: row.id,
              title: row.title ?? "Untitled",
              category: row.category,
              subcategory: row.subcategory,
              area: row.area,
              budget_type: row.budget_type,
              budget_value: row.budget_value,
              budget_min: row.budget_min,
              budget_max: row.budget_max,
              start_timing: row.start_timing,
              created_at: row.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
