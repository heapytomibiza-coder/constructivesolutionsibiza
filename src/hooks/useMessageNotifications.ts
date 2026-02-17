/**
 * MESSAGE NOTIFICATIONS HOOK
 * 
 * Provides three layers of notification for new messages:
 * 1. In-app toast with link to conversation
 * 2. Browser notification (Web Notifications API) for background tabs
 * 3. Notification sound
 * 
 * Mounted once in SessionProvider for all authenticated users.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const NOTIFICATION_SOUND_URL = '/sounds/notify.mp3';

interface MessagePayload {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  message_type: string;
  created_at: string;
}

export function useMessageNotifications(userId: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigateRef = useRef<((path: string) => void) | null>(null);

  // We can't call useNavigate here directly since this hook may be used
  // outside a router context check — but SessionProvider is inside BrowserRouter, so it's fine
  try {
    const navigate = useNavigate();
    navigateRef.current = navigate;
  } catch {
    // Not in router context — skip navigation
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

  // Request browser notification permission on mount
  useEffect(() => {
    if (!userId) return;
    if ('Notification' in window && Notification.permission === 'default') {
      // Delay to avoid annoying users immediately
      const timer = setTimeout(() => {
        Notification.requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay — silent fail
      });
    }
  }, []);

  const showBrowserNotification = useCallback((preview: string, conversationId: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('New message — CS Ibiza', {
        body: preview.length > 100 ? preview.slice(0, 100) + '…' : preview,
        icon: '/favicon.ico',
        tag: `msg-${conversationId}`, // Prevents duplicate notifications per convo
      });

      notification.onclick = () => {
        window.focus();
        navigateRef.current?.(`/messages/${conversationId}`);
        notification.close();
      };

      // Auto-close after 6 seconds
      setTimeout(() => notification.close(), 6000);
    }
  }, []);

  const showToast = useCallback((preview: string, conversationId: string) => {
    toast('💬 New message', {
      description: preview.length > 80 ? preview.slice(0, 80) + '…' : preview,
      action: {
        label: 'View',
        onClick: () => navigateRef.current?.(`/messages/${conversationId}`),
      },
      duration: 5000,
    });
  }, []);

  // Subscribe to new messages via Realtime
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`msg-notify-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as MessagePayload;

          // Skip own messages and system messages
          if (msg.sender_id === userId || msg.message_type !== 'user') return;

          const preview = msg.body || 'New message';

          // Fire all three notification layers
          playSound();
          showToast(preview, msg.conversation_id);
          showBrowserNotification(preview, msg.conversation_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, playSound, showToast, showBrowserNotification]);
}
