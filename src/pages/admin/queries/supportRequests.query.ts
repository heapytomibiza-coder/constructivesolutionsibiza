/**
 * Support requests query for admin inbox
 */
import { supabase } from "@/integrations/supabase/client";
import type { SupportRequest, SupportStatusFilter } from "../types";

export async function fetchSupportRequests(filter: SupportStatusFilter = 'all'): Promise<SupportRequest[]> {
  let query = supabase
    .from("admin_support_inbox")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply status filter
  if (filter === 'open') {
    query = query.eq('status', 'open');
  } else if (filter === 'triage') {
    query = query.eq('status', 'triage');
  } else if (filter === 'assigned') {
    query = query.not('assigned_to', 'is', null);
  } else if (filter === 'assigned_to_me') {
    // Need to get current user - this filter is handled client-side via the hook
    // Pass through here, the hook will handle it
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      query = query.eq('assigned_to', user.id);
    }
  } else if (filter === 'resolved') {
    query = query.in('status', ['resolved', 'closed']);
  } else if (filter === 'active') {
    query = query.in('status', ['open', 'triage', 'joined']);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error("Error fetching support requests:", error);
    throw error;
  }

  return (data ?? []) as SupportRequest[];
}
