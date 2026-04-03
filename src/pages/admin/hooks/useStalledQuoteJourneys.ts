import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StalledJourney {
  conversation_id: string;
  job_id: string;
  job_title: string;
  pro_id: string;
  pro_display_name: string | null;
  stall_type: 'no_quote' | 'no_hire';
  hours_since_activity: number;
}

export function useStalledQuoteJourneys() {
  return useQuery({
    queryKey: ['admin', 'stalled_quote_journeys'],
    queryFn: async (): Promise<StalledJourney[]> => {
      const { data, error } = await supabase.rpc('get_stalled_quote_journeys' as any);
      if (error) throw error;
      return (data as unknown as StalledJourney[]) ?? [];
    },
    staleTime: 5 * 60_000,
  });
}
