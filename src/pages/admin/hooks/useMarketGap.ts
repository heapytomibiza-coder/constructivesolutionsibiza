import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketGapCell {
  area: string;
  category: string;
  demand_count: number;
  total_budget: number;
  supply_count: number;
  gap_score: number;
}

export function useMarketGap(from?: string, to?: string) {
  return useQuery({
    queryKey: ["admin", "market_gap", from, to],
    queryFn: async (): Promise<MarketGapCell[]> => {
      const { data, error } = await supabase.rpc("admin_market_gap", {
        p_from_ts: from ?? new Date(Date.now() - 30 * 86400000).toISOString(),
        p_to_ts: to ?? new Date().toISOString(),
      });
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return (Array.isArray(parsed) ? parsed : []) as MarketGapCell[];
    },
    staleTime: 60_000,
  });
}
