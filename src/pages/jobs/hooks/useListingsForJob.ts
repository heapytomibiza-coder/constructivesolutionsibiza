/**
 * useListingsForJob - Fetch matching live service listings for a job's micro
 * Used in job detail page for "Compare Service Providers" section
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useListingsForJob(microSlug: string | null | undefined) {
  return useQuery({
    queryKey: ['listings-for-job', microSlug],
    enabled: !!microSlug,
    queryFn: async () => {
      // First resolve micro_slug -> micro_id
      const { data: micro } = await supabase
        .from('service_micro_categories')
        .select('id')
        .eq('slug', microSlug!)
        .eq('is_active', true)
        .single();

      if (!micro) return [];

      const { data, error } = await supabase
        .from('service_listings_browse')
        .select('*')
        .eq('micro_id', micro.id)
        .order('starting_price', { ascending: true, nullsFirst: false })
        .order('view_count', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
