import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { trackEvent } from "@/lib/trackEvent";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  message_type?: 'user' | 'system';
  metadata?: Record<string, unknown>;
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  // Cast message_type from string to union type
  return (data ?? []).map((msg) => ({
    ...msg,
    message_type: (msg.message_type as 'user' | 'system') || 'user',
    metadata: msg.metadata as Record<string, unknown> | undefined,
  }));
}

async function sendMessage(conversationId: string, senderId: string, body: string): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    message_type: (data.message_type as 'user' | 'system') || 'user',
    metadata: data.metadata as Record<string, unknown> | undefined,
  };
}

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 10_000,
  });

  // Defense-in-depth: verify current user is a participant before subscribing.
  // RLS on the messages table already prevents unauthorized data from being
  // delivered via Postgres Changes, but this application-level guard adds an
  // extra layer and avoids holding a channel open unnecessarily.
  const participantVerified = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function verifyAndSubscribe() {
      // Only re-verify if the conversationId changed
      if (participantVerified.current !== conversationId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data: convo } = await supabase
          .from("conversations")
          .select("client_id, pro_id")
          .eq("id", conversationId!)
          .maybeSingle();

        if (cancelled) return;

        if (!convo || (convo.client_id !== user.id && convo.pro_id !== user.id)) {
          // Not a participant — skip subscription
          console.warn("[useMessages] User is not a participant; skipping realtime subscription.");
          return;
        }
        participantVerified.current = conversationId!;
      }

      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            queryClient.setQueryData<Message[]>(
              ["messages", conversationId],
              (old) => {
                if (!old) return [payload.new as Message];
                if (old.some((m) => m.id === (payload.new as Message).id)) return old;
                return [...old, payload.new as Message];
              }
            );
          }
        )
        .subscribe();
    }

    verifyAndSubscribe();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, queryClient]);

  return query;
}

/** Hard cap mirroring the DB check constraint `messages_body_check` (1..5000). */
export const MESSAGE_MAX_LENGTH = 5000;

export function useSendMessage(
  conversationId: string | undefined,
  senderId: string | undefined,
  senderRole: 'client' | 'professional' | 'admin' = 'client',
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: string) => {
      if (!conversationId || !senderId) {
        throw new Error("Missing conversation or sender");
      }
      // Defensive client-side cap; DB also enforces via messages_body_check.
      if (body.trim().length > MESSAGE_MAX_LENGTH) {
        throw new Error(`Message exceeds ${MESSAGE_MAX_LENGTH} character limit`);
      }
      return sendMessage(conversationId, senderId, body);
    },
    onSuccess: (newMessage) => {
      // Add to cache immediately
      queryClient.setQueryData<Message[]>(
        ["messages", conversationId],
        (old) => {
          if (!old) return [newMessage];
          if (old.some((m) => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        }
      );
      // Invalidate conversations list in background (don't block/re-render thread)
      queryClient.invalidateQueries({ queryKey: ["conversations"], refetchType: 'none' });
      // Track message_sent for engagement velocity — use the actual sender role.
      trackEvent('message_sent', senderRole, { conversation_id: conversationId });
    },
  });

  const send = useCallback(
    (body: string) => {
      if (body.trim()) {
        mutation.mutate(body);
      }
    },
    [mutation]
  );

  return { send, isSending: mutation.isPending, error: mutation.error };
}
