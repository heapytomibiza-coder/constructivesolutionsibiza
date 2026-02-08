/**
 * Update support ticket status
 */
import { supabase } from "@/integrations/supabase/client";

type SupportStatus = 'open' | 'triage' | 'joined' | 'resolved' | 'closed';

interface UpdateResult {
  success: boolean;
  error?: string;
}

export async function updateSupportStatus(
  ticketId: string,
  newStatus: SupportStatus
): Promise<UpdateResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get current status for event logging
    const { data: ticket } = await supabase
      .from("support_requests")
      .select("status")
      .eq("id", ticketId)
      .single();

    const oldStatus = ticket?.status;

    // Update the ticket
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'resolved' || newStatus === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("support_requests")
      .update(updateData)
      .eq("id", ticketId);

    if (updateError) throw updateError;

    // Log the status change event
    const { error: eventError } = await supabase
      .from("support_request_events")
      .insert({
        support_request_id: ticketId,
        event_type: newStatus === 'resolved' ? 'resolved' : 'status_change',
        actor_user_id: user.id,
        actor_role: 'support',
        metadata: { old_status: oldStatus, new_status: newStatus },
      });

    if (eventError) {
      console.error("Failed to log event:", eventError);
    }

    // Log to admin actions
    await supabase.from("admin_actions_log").insert({
      admin_user_id: user.id,
      action_type: `support_status_${newStatus}`,
      target_type: "support_request",
      target_id: ticketId,
      metadata: { old_status: oldStatus, new_status: newStatus },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update status" };
  }
}
