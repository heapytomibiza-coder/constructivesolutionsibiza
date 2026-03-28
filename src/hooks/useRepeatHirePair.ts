import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RepeatHirePair {
  hireCount: number;
  lastHiredAt: string | null;
}

/**
 * Fetch repeat-hire count between a specific client and professional.
 * Returns { hireCount, lastHiredAt } for completed jobs only.
 */
export function useRepeatHirePair(clientId: string | null, proId: string | null) {
  return useQuery<RepeatHirePair>({
    queryKey: ['repeat-hire-pair', clientId, proId],
    enabled: !!clientId && !!proId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_repeat_hire_pair' as any, {
        p_client_id: clientId!,
        p_pro_id: proId!,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        hireCount: Number(row?.hire_count ?? 0),
        lastHiredAt: row?.last_hired_at ?? null,
      };
    },
  });
}
