/**
 * useProfessionalServices - Manages professional service selections
 * Provides current selections and mutation functions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';

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
        .eq('user_id', user!.id);

      if (error) throw error;
      return new Set(data?.map(s => s.micro_id) || []);
    },
  });

  // Toggle a single micro service (add or remove)
  const toggleMutation = useMutation({
    mutationFn: async ({ microId, isSelected }: { microId: string; isSelected: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isSelected) {
        // Add the service
        const { error } = await supabase
          .from('professional_services')
          .upsert({
            user_id: user.id,
            micro_id: microId,
            status: 'offered',
          }, { onConflict: 'user_id,micro_id' });

        if (error) throw error;

        // Auto-create draft service listing
        await supabase.rpc('create_draft_service_listings', {
          p_provider_id: user.id,
          p_micro_ids: [microId],
        });
      } else {
        // Remove the service
        const { error } = await supabase
          .from('professional_services')
          .delete()
          .eq('user_id', user.id)
          .eq('micro_id', microId);

        if (error) throw error;
      }

      // Update services count
      await updateServicesCount(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-binary'] });
    },
    onError: (error) => {
      console.error('Error toggling service:', error);
      toast.error('Failed to update selection');
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

      // Auto-create draft service listings for newly added micros
      await supabase.rpc('create_draft_service_listings', {
        p_provider_id: user.id,
        p_micro_ids: microIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-binary'] });
    },
    onError: (error) => {
      console.error('Error bulk adding services:', error);
      toast.error('Failed to add services');
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-binary'] });
    },
    onError: (error) => {
      console.error('Error bulk removing services:', error);
      toast.error('Failed to remove services');
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

// Helper to update services count on profile
async function updateServicesCount(userId: string) {
  const { count } = await supabase
    .from('professional_services')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  await supabase
    .from('professional_profiles')
    .update({ services_count: count || 0 })
    .eq('user_id', userId);
}
