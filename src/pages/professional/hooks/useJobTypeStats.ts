import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface JobTypeStat {
  microSlug: string;
  openJobs: number;
  commonTiming: 'asap' | 'flexible' | 'scheduled' | null;
}

/**
 * Fetches live job stats for a list of micro slugs.
 * Returns open job count and most common timing pattern per micro.
 */
export function useJobTypeStats(microSlugs: string[]) {
  return useQuery({
    queryKey: ['job_type_stats', microSlugs.slice().sort().join(',')],
    enabled: microSlugs.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<Record<string, JobTypeStat>> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('jobs')
        .select('micro_slug, start_timing')
        .in('micro_slug', microSlugs)
        .eq('status', 'open')
        .gte('created_at', thirtyDaysAgo);

      if (error) throw error;

      // Aggregate stats per micro
      const statsMap: Record<string, { count: number; timings: Record<string, number> }> = {};
      
      for (const job of data || []) {
        if (!job.micro_slug) continue;
        
        if (!statsMap[job.micro_slug]) {
          statsMap[job.micro_slug] = { count: 0, timings: {} };
        }
        
        statsMap[job.micro_slug].count++;
        
        if (job.start_timing) {
          statsMap[job.micro_slug].timings[job.start_timing] = 
            (statsMap[job.micro_slug].timings[job.start_timing] || 0) + 1;
        }
      }

      // Convert to final format with most common timing
      const result: Record<string, JobTypeStat> = {};
      
      for (const slug of microSlugs) {
        const stat = statsMap[slug];
        
        if (stat) {
          // Find most common timing
          let commonTiming: 'asap' | 'flexible' | 'scheduled' | null = null;
          let maxCount = 0;
          
          for (const [timing, count] of Object.entries(stat.timings)) {
            if (count > maxCount) {
              maxCount = count;
              // Map timing values to categories
              if (timing === 'asap' || timing === 'this_week') {
                commonTiming = 'asap';
              } else if (timing === 'flexible' || timing === 'this_month') {
                commonTiming = 'flexible';
              } else if (timing === 'date') {
                commonTiming = 'scheduled';
              }
            }
          }
          
          result[slug] = {
            microSlug: slug,
            openJobs: stat.count,
            commonTiming,
          };
        } else {
          result[slug] = {
            microSlug: slug,
            openJobs: 0,
            commonTiming: null,
          };
        }
      }

      return result;
    },
  });
}
