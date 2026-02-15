import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminMetricKey } from "../lib/metricRegistry";

export function useAdminMetricDrilldown(args: {
  metric: AdminMetricKey;
  from: string;
  to: string;
  area?: string | null;
  category?: string | null;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "metric_drilldown", args],
    queryFn: async (): Promise<Record<string, unknown>[]> => {
      const { data, error } = await supabase.rpc("admin_metric_drilldown", {
        p_metric_key: args.metric,
        p_from_ts: args.from,
        p_to_ts: args.to,
        p_area_filter: args.area ?? null,
        p_category_filter: args.category ?? null,
        p_limit_n: args.limit ?? 50,
        p_offset_n: args.offset ?? 0,
      });
      if (error) throw error;
      // RPC returns jsonb — parse if needed
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return (Array.isArray(parsed) ? parsed : []) as Record<string, unknown>[];
    },
    staleTime: 15_000,
  });
}
