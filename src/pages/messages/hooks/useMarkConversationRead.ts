import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to mark a conversation as read for the current user.
 * Debounced to avoid hammering updates when messages arrive quickly.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      conversationId,
      isClient,
    }: {
      conversationId: string;
      isClient: boolean;
    }) => {
      const updateData = isClient
        ? { last_read_at_client: new Date().toISOString() }
        : { last_read_at_pro: new Date().toISOString() };

      const { error } = await supabase
        .from("conversations")
        .update(updateData)
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all conversation queries (regardless of userId)
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
    },
  });

  const markRead = useCallback(
    (conversationId: string, userId: string, clientId: string) => {
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce by 300ms to batch rapid updates
      debounceRef.current = setTimeout(() => {
        const isClient = userId === clientId;
        mutation.mutate({ conversationId, isClient });
      }, 300);
    },
    [mutation]
  );

  return { markRead, isMarking: mutation.isPending };
}
