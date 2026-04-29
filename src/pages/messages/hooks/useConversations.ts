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
  job_status?: string;
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

async function fetchConversations(currentUserId: string): Promise<Conversation[]> {
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

  // Fetch job titles + category — degrade gracefully on failure so the
  // base conversations list always renders even if enrichment fails.
  let jobMap = new Map<string, { id: string; title: string | null; category: string | null; status: string | null }>();
  try {
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, category, status")
      .in("id", jobIds);
    if (jobsError) {
      console.warn("[useConversations] jobs enrichment failed:", jobsError.message);
    } else {
      jobMap = new Map(jobs?.map((j) => [j.id, j]) ?? []);
    }
  } catch (err) {
    console.warn("[useConversations] jobs enrichment threw:", err);
  }

  // Fetch display names for all participants — each fetch is isolated so a
  // single failure cannot reject the whole enrichment and blank the sidebar.
  const allUserIds = [...new Set(conversations.flatMap((c) => [c.client_id, c.pro_id]))];

  let profileMap = new Map<string, string | null>();
  let proProfileMap = new Map<string, string | null>();

  const [profilesRes, proProfilesRes] = await Promise.allSettled([
    supabase.from("profiles").select("user_id, display_name").in("user_id", allUserIds),
    supabase.from("professional_profiles").select("user_id, display_name, business_name").in("user_id", allUserIds),
  ]);

  if (profilesRes.status === "fulfilled") {
    if (profilesRes.value.error) {
      console.warn("[useConversations] profiles enrichment failed:", profilesRes.value.error.message);
    } else {
      profileMap = new Map(profilesRes.value.data?.map((p) => [p.user_id, p.display_name]) ?? []);
    }
  } else {
    console.warn("[useConversations] profiles enrichment threw:", profilesRes.reason);
  }

  if (proProfilesRes.status === "fulfilled") {
    if (proProfilesRes.value.error) {
      console.warn("[useConversations] pro profiles enrichment failed:", proProfilesRes.value.error.message);
    } else {
      proProfileMap = new Map(
        proProfilesRes.value.data?.map((p) => [p.user_id, p.display_name || p.business_name]) ?? []
      );
    }
  } else {
    console.warn("[useConversations] pro profiles enrichment threw:", proProfilesRes.reason);
  }

  return conversations.map((c) => {
    const otherUserId = c.client_id === currentUserId ? c.pro_id : c.client_id;
    const otherName =
      proProfileMap.get(otherUserId) ||
      profileMap.get(otherUserId) ||
      undefined;

    return {
      ...c,
      unread_count: Number(c.unread_count) || 0,
      job_title: jobMap.get(c.job_id)?.title ?? undefined,
      job_category: jobMap.get(c.job_id)?.category ?? undefined,
      job_status: jobMap.get(c.job_id)?.status ?? undefined,
      other_party_name: otherName,
    };
  });
}

export function useConversations(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => fetchConversations(userId!),
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
