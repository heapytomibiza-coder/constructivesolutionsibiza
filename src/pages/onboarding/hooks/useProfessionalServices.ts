/**
 * useProfessionalServices - Manages professional service selections
 * Provides current selections and mutation functions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import i18next from 'i18next';

export function useProfessionalServices() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Fetch current selections
  const { data: selectedMicroIds = new Set<string>(), isLoading, refetch } = useQuery({
    queryKey: ['professional-services-binary', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('professional_services')
        .select('micro_id')
        .eq('user_id', user!.id)
        .eq('status', 'offered');

      if (error) throw error;
      return new Set(data?.map(s => s.micro_id) || []);
    },
  });

  // Toggle a single micro service (add or remove)
  const toggleMutation = useMutation({
    mutationFn: async ({ microId, isSelected }: { microId: string; isSelected: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isSelected) {
        const { error } = await supabase
          .from('professional_services')
          .upsert({
            user_id: user.id,
            micro_id: microId,
            status: 'offered',
          }, { onConflict: 'user_id,micro_id' });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('professional_services')
          .delete()
          .eq('user_id', user.id)
          .eq('micro_id', microId);

        if (error) throw error;
      }

      await updateServicesCount(user.id);
      await syncServiceListings(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-binary'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
    onError: (error) => {
      console.error('Error toggling service:', error);
      toast.error(i18next.t('onboarding:serviceUnlock.errorToggle', 'Failed to update selection'));
    },
  });

  // Bulk add services
  const bulkAddMutation = useMutation({
    mutationFn: async (microIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (microIds.length === 0) return;

      const inserts = microIds.map(micro_id => ({
        user_id: user.id,
        micro_id,
        status: 'offered',
      }));

      const { error } = await supabase
        .from('professional_services')
        .upsert(inserts, { onConflict: 'user_id,micro_id' });

      if (error) throw error;

      await updateServicesCount(user.id);
      await syncServiceListings(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-binary'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
    onError: (error) => {
      console.error('Error bulk adding services:', error);
      toast.error(i18next.t('onboarding:serviceUnlock.errorToggle', 'Failed to add services'));
    },
  });

  // Bulk remove services
  const bulkRemoveMutation = useMutation({
    mutationFn: async (microIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (microIds.length === 0) return;

      const { error } = await supabase
        .from('professional_services')
        .delete()
        .eq('user_id', user.id)
        .in('micro_id', microIds);

      if (error) throw error;

      await updateServicesCount(user.id);
      await syncServiceListings(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-binary'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
    onError: (error) => {
      console.error('Error bulk removing services:', error);
      toast.error(i18next.t('onboarding:serviceUnlock.errorToggle', 'Failed to remove services'));
    },
  });

  return {
    selectedMicroIds,
    isLoading,
    refetch,
    toggleService: toggleMutation.mutate,
    bulkAddServices: bulkAddMutation.mutate,
    bulkRemoveServices: bulkRemoveMutation.mutate,
    isUpdating: toggleMutation.isPending || bulkAddMutation.isPending || bulkRemoveMutation.isPending,
  };
}

async function syncServiceListings(userId: string) {
  const { error } = await supabase.rpc('sync_service_listings_for_provider', {
    p_provider_id: userId,
  });

  if (error) {
    console.warn('[syncServiceListings] First attempt failed, retrying…', error.message);
    // One retry after short delay
    await new Promise(r => setTimeout(r, 1000));
    const { error: retryError } = await supabase.rpc('sync_service_listings_for_provider', {
      p_provider_id: userId,
    });
    if (retryError) {
      console.error('[syncServiceListings] Retry also failed', retryError.message);
      // Don't throw — the service mutation already committed; drift will self-heal on next page load
    }
  }
}

// Helper to update services count on profile
async function updateServicesCount(userId: string) {
  const { count, error: countError } = await supabase
    .from('professional_services')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw countError;

  const { error: profileError } = await supabase
    .from('professional_profiles')
    .update({ services_count: count || 0 })
    .eq('user_id', userId);

  if (profileError) throw profileError;
}
