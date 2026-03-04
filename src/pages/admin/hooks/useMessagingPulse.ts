import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MessagingPulseSummary {
  total_messages: number;
  active_conversations: number;
  unique_senders: number;
  unique_pros_messaging: number;
  unique_clients_messaging: number;
}

export interface ResponseTimeStats {
  total_convos: number;
  convos_with_pro_reply: number;
  convos_no_pro_reply: number;
  avg_response_minutes: number | null;
  median_response_minutes: number | null;
  min_response_minutes: number | null;
  max_response_minutes: number | null;
  replied_within_30m: number;
  replied_within_1h: number;
  replied_within_4h: number;
}

export interface DailyVolume {
  day: string;
  total: number;
  from_clients: number;
  from_pros: number;
}

export interface StaleConversation {
  id: string;
  job_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  job_title: string;
  category: string | null;
  area: string | null;
  job_status: string;
  pro_name: string | null;
  hours_silent: number;
}

export interface ActiveConversation {
  conversation_id: string;
  msg_count: number;
  last_msg_at: string;
  job_title: string;
  category: string | null;
  pro_name: string | null;
  client_name: string | null;
}

export interface MessagingPulseData {
  summary: MessagingPulseSummary;
  response_times: ResponseTimeStats;
  daily_volume: DailyVolume[];
  stale_conversations: StaleConversation[];
  most_active: ActiveConversation[];
}

export function useMessagingPulse(days = 30) {
  return useQuery({
    queryKey: ["admin", "messaging_pulse", days],
    queryFn: async (): Promise<MessagingPulseData> => {
      const from = new Date(Date.now() - days * 86400000).toISOString();
      const to = new Date().toISOString();
      const { data, error } = await supabase.rpc("admin_messaging_pulse", {
        p_from_ts: from,
        p_to_ts: to,
      });
      if (error) throw error;
      return data as unknown as MessagingPulseData;
    },
    staleTime: 60_000,
  });
}
