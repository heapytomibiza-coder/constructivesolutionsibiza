import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "../queries/keys";

export interface OnboardingHealth {
  stuck_not_started: number;
  stuck_basic_info: number;
  stuck_service_setup: number;
  no_zones: number;
  no_phone: number;
  zero_offered_services: number;
  completed_24h: number;
}

export function useOnboardingHealth() {
  return useQuery({
    queryKey: [...adminKeys.all, "onboarding_health"] as const,
    queryFn: async (): Promise<OnboardingHealth> => {
      const { data, error } = await supabase.rpc("admin_onboarding_health");
      if (error) throw error;
      return data as unknown as OnboardingHealth;
    },
    refetchInterval: 60_000,
  });
}
