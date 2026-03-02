import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Conversation {
  id: string;
  job_id: string;
  client_id: string;
  pro_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  last_read_at_client: string | null;
  last_read_at_pro: string | null;
  unread_count: number;
  job_title?: string;
  job_category?: string;
  other_party_name?: string;
}

interface ConversationRpcRow {
  id: string;
  job_id: string;
  client_id: string;
  pro_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  last_read_at_client: string | null;
  last_read_at_pro: string | null;
  unread_count: number;
}

async function fetchConversations(): Promise<Conversation[]> {
  // Use the RPC function that includes unread_count
  const { data, error } = await supabase.rpc("get_conversations_with_unread");

  if (error) throw error;

  const conversations = (data ?? []) as ConversationRpcRow[];

  if (conversations.length === 0) return [];

  // Fetch job titles for context
  const jobIds = [...new Set(conversations.map((c) => c.job_id).filter(Boolean))];

  if (jobIds.length === 0) {
    return conversations.map((c) => ({ ...c, unread_count: Number(c.unread_count) || 0 }));
  }

  // Fetch job titles + category
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, category")
    .in("id", jobIds);

  if (jobsError) throw jobsError;

  const jobMap = new Map(jobs?.map((j) => [j.id, j]) ?? []);

  // Fetch display names for all participants
  const allUserIds = [...new Set(conversations.flatMap((c) => [c.client_id, c.pro_id]))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", allUserIds);

  const { data: proProfiles } = await supabase
    .from("professional_profiles")
    .select("user_id, display_name, business_name")
    .in("user_id", allUserIds);

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
  const proProfileMap = new Map(
    proProfiles?.map((p) => [p.user_id, p.display_name || p.business_name]) ?? []
  );

  // Get the current user to determine "other party"
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id;

  return conversations.map((c) => {
    const otherUserId = c.client_id === currentUserId ? c.pro_id : c.client_id;
    const otherName =
      proProfileMap.get(otherUserId) ||
      profileMap.get(otherUserId) ||
      undefined;

    return {
      ...c,
      unread_count: Number(c.unread_count) || 0,
      job_title: jobMap.get(c.job_id)?.title ?? "Untitled Job",
      job_category: jobMap.get(c.job_id)?.category ?? undefined,
      other_party_name: otherName,
    };
  });
}

export function useConversations(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["conversations", userId],
    queryFn: fetchConversations,
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Realtime subscription for conversation updates - scoped to current user
  useEffect(() => {
    if (!userId) return;

    const channels: RealtimeChannel[] = [];

    // Subscribe to conversations where user is client
    const clientChannel = supabase
      .channel(`conversations-client-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `client_id=eq.${userId}`,
        },
        () => query.refetch()
      )
      .subscribe();

    // Subscribe to conversations where user is pro
    const proChannel = supabase
      .channel(`conversations-pro-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `pro_id=eq.${userId}`,
        },
        () => query.refetch()
      )
      .subscribe();

    channels.push(clientChannel, proChannel);

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [userId, query.refetch]);

  return query;
}
