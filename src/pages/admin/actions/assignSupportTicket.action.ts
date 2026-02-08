/**
 * Assign support ticket to current admin user
 */
import { supabase } from "@/integrations/supabase/client";

interface AssignResult {
  success: boolean;
  error?: string;
}

export async function assignSupportTicket(ticketId: string): Promise<AssignResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update the ticket
    const { error: updateError } = await supabase
      .from("support_requests")
      .update({
        assigned_to: user.id,
        status: 'triage',
      })
      .eq("id", ticketId);

    if (updateError) throw updateError;

    // Log the event
    const { error: eventError } = await supabase
      .from("support_request_events")
      .insert({
        support_request_id: ticketId,
        event_type: 'assigned',
        actor_user_id: user.id,
        actor_role: 'support',
        metadata: { assigned_to: user.id },
      });

    if (eventError) {
      console.error("Failed to log event:", eventError);
    }

    // Log to admin actions
    await supabase.from("admin_actions_log").insert({
      admin_user_id: user.id,
      action_type: "assign_support_ticket",
      target_type: "support_request",
      target_id: ticketId,
      metadata: { assigned_to: user.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to assign ticket" };
  }
}
