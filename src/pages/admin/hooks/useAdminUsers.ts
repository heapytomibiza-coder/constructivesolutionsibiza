import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminUser, UserStatusFilter } from "../types";

/**
 * Fetch users for admin management
 */
async function fetchAdminUsers(filter: UserStatusFilter, search: string): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("rpc_admin_users_list");

  if (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }

  let users = (data ?? []) as AdminUser[];

  // Client-side filtering (RPC returns all users, we filter here)
  if (filter === 'active') {
    users = users.filter(u => !u.suspended_at && !u.roles?.includes('professional'));
  } else if (filter === 'professionals') {
    users = users.filter(u => u.roles?.includes('professional'));
  } else if (filter === 'suspended') {
    users = users.filter(u => u.suspended_at !== null);
  }

  // Client-side search
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    users = users.filter(u => 
      u.display_name?.toLowerCase().includes(searchLower) ||
      u.phone?.includes(search) ||
      u.id.includes(search)
    );
  }

  // Sort by created_at descending
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return users.slice(0, 100);
}

/**
 * Hook for admin user list
 */
export function useAdminUsers(filter: UserStatusFilter = 'all', search: string = '') {
  return useQuery({
    queryKey: ["admin", "users", filter, search],
    queryFn: () => fetchAdminUsers(filter, search),
    staleTime: 10_000, // 10 seconds
  });
}
