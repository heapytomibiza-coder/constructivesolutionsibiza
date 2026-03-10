/**
 * Support requests query for admin inbox
 */
import { supabase } from "@/integrations/supabase/client";
import type { SupportRequest, SupportStatusFilter } from "../types";

export async function fetchSupportRequests(filter: SupportStatusFilter = 'all'): Promise<SupportRequest[]> {
  const { data, error } = await supabase.rpc("rpc_admin_support_inbox");

  if (error) {
    console.error("Error fetching support requests:", error);
    throw error;
  }

  let tickets = (data ?? []) as SupportRequest[];

  // Client-side filtering
  if (filter === 'open') {
    tickets = tickets.filter(t => t.status === 'open');
  } else if (filter === 'triage') {
    tickets = tickets.filter(t => t.status === 'triage');
  } else if (filter === 'assigned') {
    tickets = tickets.filter(t => t.assigned_to !== null);
  } else if (filter === 'assigned_to_me') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      tickets = tickets.filter(t => t.assigned_to === user.id);
    }
  } else if (filter === 'resolved') {
    tickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  } else if (filter === 'active') {
    tickets = tickets.filter(t => ['open', 'triage', 'joined'].includes(t.status));
  }

  // Sort by created_at descending
  tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return tickets.slice(0, 100);
}
