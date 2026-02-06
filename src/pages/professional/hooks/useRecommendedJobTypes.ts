import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface RecommendedJobType {
  microSlug: string;
  microName: string;
  microId: string;
  jobCount: number;
}

/**
 * Fetches recommended job types based on active demand for a given subcategory.
 * Returns top micros with highest open job counts.
 */
export function useRecommendedJobTypes(subcategoryId: string, limit = 5) {
  return useQuery({
    queryKey: ['recommended_job_types', subcategoryId, limit],
    enabled: !!subcategoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<RecommendedJobType[]> => {
      // First get micros for the subcategory
      const { data: micros, error: microsError } = await supabase
        .from('service_micro_categories')
        .select('id, name, slug')
        .eq('subcategory_id', subcategoryId)
        .eq('is_active', true);

      if (microsError) throw microsError;
      if (!micros?.length) return [];

      const slugs = micros.map(m => m.slug);
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Get job counts per micro slug
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('micro_slug')
        .in('micro_slug', slugs)
        .eq('status', 'open')
        .gte('created_at', thirtyDaysAgo);

      if (jobsError) throw jobsError;

      // Count jobs per slug
      const countMap: Record<string, number> = {};
      for (const job of jobs || []) {
        if (job.micro_slug) {
          countMap[job.micro_slug] = (countMap[job.micro_slug] || 0) + 1;
        }
      }

      // Build result with counts, sorted by count desc
      const result: RecommendedJobType[] = micros
        .map(m => ({
          microSlug: m.slug,
          microName: m.name,
          microId: m.id,
          jobCount: countMap[m.slug] || 0,
        }))
        .filter(r => r.jobCount > 0)
        .sort((a, b) => b.jobCount - a.jobCount)
        .slice(0, limit);

      return result;
    },
  });
}
