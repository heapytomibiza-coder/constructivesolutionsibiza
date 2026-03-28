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
 * Fetch demand snapshots for the pro insights dashboard.
 * Returns category-level and area-level demand data.
 */
export function useDemandData() {
  return useQuery<DemandSnapshot[]>({
    queryKey: ['demand-snapshots'],
    staleTime: 30 * 60 * 1000, // 30 min — data refreshes every 6h
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demand_snapshots' as any)
        .select('id, category, area, job_count_7d, job_count_30d, pct_change_7d, snapshot_date')
        .order('job_count_7d', { ascending: false })
        .limit(100);

      if (error) throw error;
      return ((data as any[]) ?? []).map((d) => ({
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
