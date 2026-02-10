import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProServiceScope {
  microIds: string[];
  subcategoryIds: string[];
  categoryIds: string[];
  isLoading: boolean;
  isEmpty: boolean;
  proName: string | null;
}

/**
 * Fetches a professional's unlocked service scope.
 * Used in direct mode to filter the wizard taxonomy
 * so the Asker can only select tasks the Tasker offers.
 */
export function useProServiceScope(professionalUserId: string | undefined): ProServiceScope {
  const { data, isLoading } = useQuery({
    queryKey: ['pro_service_scope', professionalUserId],
    enabled: !!professionalUserId,
    staleTime: 5 * 60 * 1000, // 5 min cache
    queryFn: async () => {
      if (!professionalUserId) return null;

      // 1. Get the professional's micro IDs
      const { data: services, error: svcErr } = await supabase
        .from('professional_services')
        .select('micro_id')
        .eq('user_id', professionalUserId)
        .eq('status', 'active');

      if (svcErr) throw svcErr;
      if (!services?.length) return { microIds: [], subcategoryIds: [], categoryIds: [], proName: null };

      const microIds = services.map(s => s.micro_id);

      // 2. Get subcategory IDs from micros
      const { data: micros, error: microErr } = await supabase
        .from('service_micro_categories')
        .select('id, subcategory_id')
        .in('id', microIds);

      if (microErr) throw microErr;

      const subcategoryIds = [...new Set(micros?.map(m => m.subcategory_id) || [])];

      // 3. Get category IDs from subcategories
      const { data: subs, error: subErr } = await supabase
        .from('service_subcategories')
        .select('id, category_id')
        .in('id', subcategoryIds);

      if (subErr) throw subErr;

      const categoryIds = [...new Set(subs?.map(s => s.category_id) || [])];

      // 4. Get pro display name
      const { data: profile } = await supabase
        .from('professional_profiles')
        .select('display_name')
        .eq('user_id', professionalUserId)
        .maybeSingle();

      return {
        microIds,
        subcategoryIds,
        categoryIds,
        proName: profile?.display_name || null,
      };
    },
  });

  return {
    microIds: data?.microIds || [],
    subcategoryIds: data?.subcategoryIds || [],
    categoryIds: data?.categoryIds || [],
    isLoading,
    isEmpty: !isLoading && (data?.microIds?.length ?? 0) === 0,
    proName: data?.proName || null,
  };
}
