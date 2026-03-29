import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DemandSnapshot {
  id: string;
  category: string;
  area: string | null;
  jobCount7d: number;
  jobCount30d: number;
  pctChange7d: number;
  snapshotDate: string;
}

/**
 * Fetch demand snapshots via tier-gated RPC.
 * Returns 403-equivalent error for Bronze/Silver users.
 */
export function useDemandData() {
  return useQuery<DemandSnapshot[]>({
    queryKey: ['demand-snapshots'],
    staleTime: 30 * 60 * 1000,
    retry: false, // Don't retry on entitlement errors
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_demand_snapshots' as any);

      if (error) {
        // Tier gating returns this exception
        if (error.message?.includes('demand_data_not_entitled')) {
          return [];
        }
        throw error;
      }
      return ((data as any[]) ?? []).map((d: any) => ({
        id: d.id,
        category: d.category,
        area: d.area,
        jobCount7d: d.job_count_7d,
        jobCount30d: d.job_count_30d,
        pctChange7d: d.pct_change_7d,
        snapshotDate: d.snapshot_date,
      }));
    },
  });
}
