import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PricingRule } from '../lib/calculateEstimate';

export function usePricingRules() {
  return useQuery({
    queryKey: ['pricing-rules'],
    queryFn: async (): Promise<PricingRule[]> => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      return (data ?? []) as unknown as PricingRule[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePricingRuleBySlug(microSlug: string | null) {
  return useQuery({
    queryKey: ['pricing-rule', microSlug],
    queryFn: async (): Promise<PricingRule | null> => {
      if (!microSlug) return null;
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('micro_slug', microSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as PricingRule | null;
    },
    enabled: !!microSlug,
    staleTime: 5 * 60 * 1000,
  });
}
