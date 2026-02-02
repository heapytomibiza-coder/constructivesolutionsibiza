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
  job_title?: string;
  job_category?: string;
}

async function fetchConversations(userId: string): Promise<Conversation[]> {
  // Note: We can't join to auth.users directly via Supabase JS client,
  // so we fetch conversations and the linked job info separately
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      job_id,
      client_id,
      pro_id,
      last_message_at,
      last_message_preview,
      created_at
    `)
    .or(`client_id.eq.${userId},pro_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch job titles for context
  const jobIds = [...new Set((data ?? []).map((c) => c.job_id))];
  
  if (jobIds.length === 0) return [];

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, category")
    .in("id", jobIds);

  const jobMap = new Map(jobs?.map((j) => [j.id, j]) ?? []);

  return (data ?? []).map((c) => ({
    ...c,
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
