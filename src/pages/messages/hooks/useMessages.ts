import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
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

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    let channel: RealtimeChannel | null = null;

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
          // Optimistically add new message to cache
          queryClient.setQueryData<Message[]>(
            ["messages", conversationId],
            (old) => {
              if (!old) return [payload.new as Message];
              // Avoid duplicates
              if (old.some((m) => m.id === (payload.new as Message).id)) return old;
              return [...old, payload.new as Message];
            }
          );
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage(conversationId: string | undefined, senderId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body: string) => {
      if (!conversationId || !senderId) {
        throw new Error("Missing conversation or sender");
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
      // Also invalidate conversations to update preview
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
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
