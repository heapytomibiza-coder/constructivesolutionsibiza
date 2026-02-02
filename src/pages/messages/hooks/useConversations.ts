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

async function fetchConversations(userId: string): Promise<Conversation[]> {
  // Use the RPC function that includes unread_count
  const { data, error } = await supabase.rpc("get_conversations_with_unread");

  if (error) throw error;

  const conversations = (data ?? []) as ConversationRpcRow[];
  
  if (conversations.length === 0) return [];

  // Fetch job titles for context
  const jobIds = [...new Set(conversations.map((c) => c.job_id))];

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, category")
    .in("id", jobIds);

  const jobMap = new Map(jobs?.map((j) => [j.id, j]) ?? []);

  return conversations.map((c) => ({
    ...c,
    unread_count: Number(c.unread_count) || 0,
    job_title: jobMap.get(c.job_id)?.title ?? "Untitled Job",
    job_category: jobMap.get(c.job_id)?.category ?? undefined,
  }));
}

export function useConversations(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => fetchConversations(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel("conversations-inbox")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          // Refetch on any change - simple but effective
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, query.refetch]);

  return query;
}
