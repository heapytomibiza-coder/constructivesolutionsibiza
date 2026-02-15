import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminAlert {
  key: string;
  severity: "red" | "yellow" | "blue";
  title: string;
  body: string;
  count: number;
  cta_label: string;
  cta_href: string;
}

export function useAdminAlerts() {
  return useQuery({
    queryKey: ["admin_operator_alerts"],
    queryFn: async (): Promise<AdminAlert[]> => {
      const { data, error } = await supabase.rpc("admin_operator_alerts");
      if (error) throw error;
      return (data as unknown as AdminAlert[]) ?? [];
    },
    refetchInterval: 60_000,
  });
}
