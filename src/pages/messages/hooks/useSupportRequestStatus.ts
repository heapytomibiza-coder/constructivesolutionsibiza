/**
 * Hook to check if a conversation has an open support request
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function checkOpenRequest(conversationId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("support_requests")
    .select("id")
    .eq("conversation_id", conversationId)
    .in("status", ["open", "triage", "joined"])
    .limit(1);

  if (error) {
    console.error("Error checking support request:", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

export function useSupportRequestStatus(conversationId: string | undefined) {
  const query = useQuery({
    queryKey: ["support-request-status", conversationId],
    queryFn: () => checkOpenRequest(conversationId!),
    enabled: !!conversationId,
    staleTime: 30_000, // 30 seconds
  });

  return {
    hasOpenRequest: query.data ?? false,
    isLoading: query.isLoading,
  };
}
