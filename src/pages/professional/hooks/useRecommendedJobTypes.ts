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
 *
 * Counts come from `job_micro_links` (canonical multi-micro source of truth)
 * joined to open jobs in the last 30 days. A multi-micro job contributes to
 * each of its micros, which is the intended demand signal for pros.
 */
export function useRecommendedJobTypes(subcategoryId: string, limit = 5) {
  return useQuery({
    queryKey: ['recommended_job_types', subcategoryId, limit],
    enabled: !!subcategoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<RecommendedJobType[]> => {
      const { data: micros, error: microsError } = await supabase
        .from('service_micro_categories')
        .select('id, name, slug')
        .eq('subcategory_id', subcategoryId)
        .eq('is_active', true);

      if (microsError) throw microsError;
      if (!micros?.length) return [];

      const slugs = micros.map(m => m.slug);
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Demand from canonical job_micro_links (multi-micro aware), restricted
      // to currently open jobs created in the last 30 days.
      const { data: links, error: linksError } = await supabase
        .from('job_micro_links')
        .select('micro_slug, jobs!inner(status, created_at)')
        .in('micro_slug', slugs)
        .eq('jobs.status', 'open')
        .gte('jobs.created_at', thirtyDaysAgo);

      if (linksError) throw linksError;

      const countMap: Record<string, number> = {};
      for (const link of links || []) {
        if (link.micro_slug) {
          countMap[link.micro_slug] = (countMap[link.micro_slug] || 0) + 1;
        }
      }

      return micros
        .map(m => ({
          microSlug: m.slug,
          microName: m.name,
          microId: m.id,
          jobCount: countMap[m.slug] || 0,
        }))
        .filter(r => r.jobCount > 0)
        .sort((a, b) => b.jobCount - a.jobCount)
        .slice(0, limit);
    },
  });
}
