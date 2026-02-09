/**
 * useMicroPreferences - Hook for managing professional micro-service preferences
 * Handles CRUD operations on professional_micro_preferences table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import type { Preference } from '../components/PreferencePill';

interface MicroPreference {
  microId: string;
  preference: Preference;
}

export function useMicroPreferences() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch current preferences
  const preferencesQuery = useQuery({
    queryKey: ['micro-preferences', userId],
    queryFn: async () => {
      if (!userId) return new Map<string, Preference>();

      const { data, error } = await supabase
        .from('professional_micro_preferences')
        .select('micro_id, preference')
        .eq('user_id', userId);

      if (error) throw error;

      // Build a Map for fast lookup
      const preferencesMap = new Map<string, Preference>();
      data?.forEach((row) => {
        // Normalize preference value to our 3-state model
        const pref = row.preference as string;
        if (pref === 'love' || pref === 'like' || pref === 'neutral') {
          preferencesMap.set(row.micro_id, pref);
        } else {
          // Default unknown values to neutral
          preferencesMap.set(row.micro_id, 'neutral');
        }
      });

      return preferencesMap;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ microId, preference }: MicroPreference) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('professional_micro_preferences')
        .upsert(
          {
            user_id: userId,
            micro_id: microId,
            preference,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,micro_id',
          }
        );

      if (error) throw error;
      return { microId, preference };
    },
    onMutate: async ({ microId, preference }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['micro-preferences', userId] });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData<Map<string, Preference>>([
        'micro-preferences',
        userId,
      ]);

      // Optimistically update
      queryClient.setQueryData<Map<string, Preference>>(
        ['micro-preferences', userId],
        (old) => {
          const newMap = new Map(old || []);
          newMap.set(microId, preference);
          return newMap;
        }
      );

      return { previousPreferences };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          ['micro-preferences', userId],
          context.previousPreferences
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['micro-preferences', userId] });
    },
  });

  return {
    preferences: preferencesQuery.data ?? new Map<string, Preference>(),
    isLoading: preferencesQuery.isLoading,
    isError: preferencesQuery.isError,
    updatePreference: (microId: string, preference: Preference) =>
      updatePreferenceMutation.mutate({ microId, preference }),
    isUpdating: updatePreferenceMutation.isPending,
  };
}
