import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminUser, UserStatusFilter } from "../types";

/**
 * Fetch users for admin management
 */
async function fetchAdminUsers(filter: UserStatusFilter, search: string): Promise<AdminUser[]> {
  let query = supabase
    .from("admin_users_list")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  // Apply status filter
  if (filter === 'active') {
    query = query.is('suspended_at', null).not('roles', 'cs', '{"professional"}');
  } else if (filter === 'professionals') {
    query = query.contains('roles', ['professional']);
  } else if (filter === 'suspended') {
    query = query.not('suspended_at', 'is', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }

  let users = (data ?? []) as AdminUser[];

  // Client-side search (for display_name and phone)
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    users = users.filter(u => 
      u.display_name?.toLowerCase().includes(searchLower) ||
      u.phone?.includes(search) ||
      u.id.includes(search)
    );
  }

  return users;
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
