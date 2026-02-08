import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Platform stats for admin dashboard
 */
export interface AdminPlatformStats {
  total_users: number;
  total_professionals: number;
  active_professionals: number;
  total_jobs: number;
  open_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  total_posts: number;
  total_conversations: number;
  open_support_tickets: number;
  new_support_tickets: number;
}

/**
 * Fetch platform-wide statistics for admin overview
 */
async function fetchAdminStats(): Promise<AdminPlatformStats> {
  // Query the admin_platform_stats view
  const { data, error } = await supabase
    .from("admin_platform_stats")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }

  return data as AdminPlatformStats;
}

/**
 * Hook for admin platform statistics
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    staleTime: 30_000, // 30 seconds
  });
}
