import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OutcomeStatus = "pending" | "observed" | "no_effect" | "expired";

export interface ActionOutcome {
  action_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  admin_user_id: string;
  action_metadata: Record<string, unknown>;
  created_at: string;
  hours_since: number;
  outcome_status: OutcomeStatus;
  outcome_details: Record<string, unknown>;
}

export function useActionOutcomes(
  actionTypes: string[] = ["nudge_client", "notify_matching_pros", "boost_category"],
  limit = 50,
) {
  return useQuery({
    queryKey: ["admin", "action_outcomes", actionTypes, limit],
    queryFn: async (): Promise<ActionOutcome[]> => {
      const { data, error } = await supabase.rpc("admin_compute_action_outcomes", {
        p_action_types: actionTypes,
        p_limit: limit,
      });
      if (error) throw error;
      return (data as unknown as ActionOutcome[]) ?? [];
    },
    staleTime: 60_000,
  });
}

/** Filter outcomes for a specific target */
export function useTargetOutcome(
  actionType: string,
  targetId: string,
) {
  const { data, ...rest } = useActionOutcomes([actionType], 100);
  const match = data?.find(
    (o) => o.target_id === targetId && o.action_type === actionType,
  );
  return { data: match, ...rest };
}
