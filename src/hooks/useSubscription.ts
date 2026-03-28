import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionTier } from '@/domain/entitlements';

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: 'active' | 'past_due' | 'cancelled';
  commissionRate: number;
  isLoading: boolean;
}

export function useSubscription(userId: string | null): SubscriptionState {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_tier', { p_user_id: userId! });
      if (error) throw error;
      // RPC returns a single-row table
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  return {
    tier: (data?.tier as SubscriptionTier) ?? 'bronze',
    status: (data?.status as SubscriptionState['status']) ?? 'active',
    commissionRate: data?.commission_rate ?? 18,
    isLoading,
  };
}
