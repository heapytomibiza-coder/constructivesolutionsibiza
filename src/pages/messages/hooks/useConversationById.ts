/**
 * Route-level conversation lookup by ID.
 *
 * Acts as both:
 *  - Fallback source of truth when the enriched list does not contain
 *    the conversation (e.g. enrichment lag, partial failure, RLS race).
 *  - Participant validation: returns null if the current user is neither
 *    client_id nor pro_id, so the page renders a controlled not-found
 *    state instead of crashing or leaking access.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConversationLookup {
  id: string;
  job_id: string;
  client_id: string;
  pro_id: string;
}

export function useConversationById(
  conversationId: string | undefined,
  userId: string | undefined,
) {
  return useQuery<ConversationLookup | null>({
    queryKey: ["conversation-lookup", conversationId, userId],
    enabled: !!conversationId && !!userId,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, job_id, client_id, pro_id")
        .eq("id", conversationId!)
        .maybeSingle();

      if (error) {
        console.warn("[useConversationById] lookup failed:", error.message);
        return null;
      }
      if (!data) return null;
      // Participant validation
      if (data.client_id !== userId && data.pro_id !== userId) {
        return null;
      }
      return data as ConversationLookup;
    },
  });
}
