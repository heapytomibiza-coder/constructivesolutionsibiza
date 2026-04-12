import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BudgetSuggestion {
  suggested_min: number | null;
  suggested_max: number | null;
  confidence: number;
  basis: number | null;
  sample_size: number;
}

export function useBudgetSuggestion(microSlugs: string[]) {
  return useQuery<BudgetSuggestion>({
    queryKey: ['budget-suggestion', ...microSlugs],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-budget-suggestion', {
        body: { micro_slugs: microSlugs },
      });
      if (error) throw error;
      return data as BudgetSuggestion;
    },
    enabled: microSlugs.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: false,
  });
}

/** Map a suggested range to the nearest budget chip value */
export function mapRangeToBudgetChip(min: number, max: number): string {
  const mid = (min + max) / 2;
  if (mid < 500) return 'under_500';
  if (mid < 1000) return '500_1000';
  if (mid < 2500) return '1000_2500';
  if (mid < 5000) return '2500_5000';
  return 'over_5000';
}
