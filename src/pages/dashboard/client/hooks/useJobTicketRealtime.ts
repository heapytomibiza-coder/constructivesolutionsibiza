/**
 * useJobTicketRealtime — Subscribe to realtime changes for a job ticket.
 * Triggers targeted React Query refetches on relevant events.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useJobTicketRealtime(jobId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!jobId) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = (keys: string[][]) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      }, 300);
    };

    const channel = supabase
      .channel(`job-ticket-${jobId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
        () => scheduleRefetch([['job_ticket', jobId]])
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes', filter: `job_id=eq.${jobId}` },
        () => scheduleRefetch([['quotes', jobId], ['my_quote', jobId]])
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_progress_updates', filter: `job_id=eq.${jobId}` },
        () => scheduleRefetch([['progress_updates', jobId], ['project_gallery', jobId]])
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_reviews', filter: `job_id=eq.${jobId}` },
        () => scheduleRefetch([['job_reviews', jobId]])
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_invites', filter: `job_id=eq.${jobId}` },
        () => scheduleRefetch([['job_invites', jobId]])
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [jobId, queryClient]);
}
