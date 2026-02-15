import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RepeatClient {
  client_id: string;
  display_name: string | null;
  total_jobs: number;
  completed_jobs: number;
  first_job_at: string;
  latest_job_at: string;
}

export interface RehiredPro {
  pro_id: string;
  display_name: string | null;
  business_name: string | null;
  total_hired: number;
  unique_clients: number;
  completed: number;
}

export interface RepeatWorkData {
  repeat_clients: RepeatClient[] | null;
  rehired_pros: RehiredPro[] | null;
  summary: {
    total_repeat_clients: number;
    total_rehired_pros: number;
  };
}

export function useRepeatWork() {
  return useQuery({
    queryKey: ["admin", "repeat_work"],
    queryFn: async (): Promise<RepeatWorkData> => {
      const { data, error } = await supabase.rpc("admin_repeat_work");
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return (parsed ?? { repeat_clients: [], rehired_pros: [], summary: { total_repeat_clients: 0, total_rehired_pros: 0 } }) as RepeatWorkData;
    },
    staleTime: 60_000,
  });
}
