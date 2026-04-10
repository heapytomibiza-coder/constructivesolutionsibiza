import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';

export function useRebook() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (sourceJobId: string) => {
      // create_rebook_job is not yet in the auto-generated types
      const { data, error } = await (supabase.rpc as Function)('create_rebook_job', {
        p_source_job_id: sourceJobId,
      });
      if (error) throw error;
      return data as unknown as { new_job_id: string };
    },
    onSuccess: (result, sourceJobId) => {
      toast.success('Draft created — review before posting');
      trackEvent(EVENTS.REBOOK_CREATED, 'client', { source_job_id: sourceJobId });
      navigate(`/post?edit=${result.new_job_id}`);
    },
    onError: () => {
      toast.error('Could not create rebook draft');
    },
  });
}
