/**
 * useMicroPreferences - Hook for managing professional micro-service preferences
 * Handles CRUD operations on professional_micro_preferences table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import type { Preference } from '../types/preferences';

const KEY = (userId: string) => ['micro-preferences', userId] as const;

export function useMicroPreferences() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const userId = user?.id;

  // Fetch current preferences
  const preferencesQuery = useQuery({
    queryKey: userId ? KEY(userId) : ['micro-preferences', 'anon'],
    queryFn: async (): Promise<Map<string, Preference>> => {
      if (!userId) return new Map();

      const { data, error } = await supabase
        .from('professional_micro_preferences')
        .select('micro_id, preference')
        .eq('user_id', userId);

      if (error) throw error;

      // Build a Map for fast lookup
      const preferencesMap = new Map<string, Preference>();
      (data ?? []).forEach((row) => {
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
    mutationFn: async (vars: { microId: string; preference: Preference }) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('professional_micro_preferences')
        .upsert(
          {
            user_id: userId,
            micro_id: vars.microId,
            preference: vars.preference,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,micro_id' }
        );

      if (error) throw error;
      return vars;
    },
    onMutate: async ({ microId, preference }) => {
      if (!userId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: KEY(userId) });

      // Snapshot previous value
      const prev = queryClient.getQueryData<Map<string, Preference>>(KEY(userId));

      // Optimistically update
      queryClient.setQueryData<Map<string, Preference>>(KEY(userId), (old) => {
        const next = new Map(old ?? []);
        next.set(microId, preference);
        return next;
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (!userId) return;
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(KEY(userId), context.prev);
      }
    },
    onSettled: () => {
      if (!userId) return;
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: KEY(userId) });
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
