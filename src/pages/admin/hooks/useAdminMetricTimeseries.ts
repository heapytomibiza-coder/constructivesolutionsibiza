import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminMetricKey } from "../lib/metricRegistry";

export interface MetricPoint {
  bucket_start: string;
  value: number;
}

export function useAdminMetricTimeseries(args: {
  metric: AdminMetricKey;
  from: string;
  to: string;
  bucket?: "hour" | "day";
  area?: string | null;
  category?: string | null;
}) {
  return useQuery({
    queryKey: ["admin", "metric_timeseries", args],
    queryFn: async (): Promise<MetricPoint[]> => {
      const { data, error } = await supabase.rpc("admin_metric_timeseries", {
        p_metric_key: args.metric,
        p_from_ts: args.from,
        p_to_ts: args.to,
        p_bucket: args.bucket ?? "day",
        p_area_filter: args.area ?? null,
        p_category_filter: args.category ?? null,
      });
      if (error) throw error;
      return (data ?? []) as MetricPoint[];
    },
    staleTime: 30_000,
  });
}
