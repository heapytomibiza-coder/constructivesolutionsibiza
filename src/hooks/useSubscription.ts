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
        .from('subscriptions')
        .select('tier, commission_rate, status')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    tier: (data?.tier as SubscriptionTier) ?? 'bronze',
    status: (data?.status as SubscriptionState['status']) ?? 'active',
    commissionRate: data?.commission_rate ?? 18,
    isLoading,
  };
}
