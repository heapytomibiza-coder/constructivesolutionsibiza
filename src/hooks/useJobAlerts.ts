/**
 * IN-APP JOB ALERTS HOOK
 *
 * Subscribes to realtime INSERT events on the jobs table.
 * Shows an in-app toast + plays a sound when a new open job is posted.
 * Only active for professionals who have job match notifications enabled.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const NOTIFICATION_SOUND_URL = '/sounds/notify.mp3';

interface JobPayload {
  id: string;
  title: string;
  status: string;
  is_publicly_listed: boolean;
  category: string | null;
  area: string | null;
  user_id: string;
}

export function useJobAlerts(userId: string | null, activeRole: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigateRef = useRef<((path: string) => void) | null>(null);

  try {
    const navigate = useNavigate();
    navigateRef.current = navigate;
  } catch {
    // Not in router context
  }

  // Pre-load audio
  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.4;
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Check if user has job match notifications enabled
  const { data: jobMatchesEnabled } = useQuery({
    queryKey: ['notification_preferences', userId, 'email_job_matches'],
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await supabase
        .from('notification_preferences')
        .select('email_job_matches')
        .eq('user_id', userId)
        .maybeSingle();
      return data?.email_job_matches ?? true;
    },
    enabled: !!userId && activeRole === 'professional',
    staleTime: 60_000,
  });

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!userId || activeRole !== 'professional' || jobMatchesEnabled === false) return;

    const channel = supabase
      .channel(`job-alerts-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
        },
        (payload) => {
          const job = payload.new as JobPayload;

          // Only notify for open, public jobs not posted by the user
          if (job.status !== 'open' || !job.is_publicly_listed || job.user_id === userId) return;

          playSound();
          toast('🔔 New job posted', {
            description: job.title.length > 80 ? job.title.slice(0, 80) + '…' : job.title,
            action: {
              label: 'View',
              onClick: () => navigateRef.current?.(`/jobs/${job.id}`),
            },
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, activeRole, jobMatchesEnabled, playSound]);
}
