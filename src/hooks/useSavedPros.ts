import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';

export interface SavedPro {
  professional_id: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_thumb_url: string | null;
  verification_status: string | null;
  tagline: string | null;
  saved_at: string;
}

export function useSavedPros() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['saved_pros', user?.id],
    queryFn: async (): Promise<SavedPro[]> => {
      const { data, error } = await (supabase.rpc as any)('get_saved_pros');
      if (error) throw error;
      return (data ?? []) as SavedPro[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useToggleSavedPro() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (professionalId: string) => {
      const { data, error } = await (supabase.rpc as any)('toggle_saved_pro', {
        p_professional_id: professionalId,
      });
      if (error) throw error;
      return data as { saved: boolean };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['saved_pros'] });
      toast.success(result.saved ? 'Pro saved' : 'Pro removed from saved');
    },
    onError: () => {
      toast.error('Could not update saved pros');
    },
  });
}

/** Check if a specific pro is saved (derived from the list query) */
export function useIsProSaved(professionalId: string | undefined): boolean {
  const { data } = useSavedPros();
  if (!professionalId || !data) return false;
  return data.some((p) => p.professional_id === professionalId);
}
