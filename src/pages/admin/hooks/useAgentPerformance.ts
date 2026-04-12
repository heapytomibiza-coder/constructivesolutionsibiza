import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentMetrics {
  agent_name: string;
  triggered: number;
  succeeded: number;
  failed: number;
  accepted: number;
  dismissed: number;
}

export function useAgentPerformance(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  return useQuery({
    queryKey: ["admin", "agent_performance", days],
    queryFn: async (): Promise<AgentMetrics[]> => {
      const { data, error } = await supabase.rpc(
        "get_agent_performance_metrics" as any,
        { p_since: since, p_until: new Date().toISOString() },
      );
      if (error) throw error;
      return (data as unknown as AgentMetrics[]) ?? [];
    },
    staleTime: 60_000,
  });
}
