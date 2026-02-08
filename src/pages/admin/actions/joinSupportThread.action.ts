/**
 * Join a conversation as support staff
 */
import { supabase } from "@/integrations/supabase/client";

interface JoinResult {
  success: boolean;
  error?: string;
}

export async function joinSupportThread(
  ticketId: string,
  conversationId: string
): Promise<JoinResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Add support as participant
    const { error: participantError } = await supabase
      .from("conversation_participants")
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        role_in_conversation: 'support',
        joined_at: new Date().toISOString(),
        left_at: null,
      }, {
        onConflict: 'conversation_id,user_id',
      });

    if (participantError) throw participantError;

    // Update ticket status to 'joined'
    const { error: ticketError } = await supabase
      .from("support_requests")
      .update({ status: 'joined' })
      .eq("id", ticketId);

    if (ticketError) throw ticketError;

    // Log the event
    const { error: eventError } = await supabase
      .from("support_request_events")
      .insert({
        support_request_id: ticketId,
        event_type: 'support_joined',
        actor_user_id: user.id,
        actor_role: 'support',
        metadata: { conversation_id: conversationId },
      });

    if (eventError) {
      console.error("Failed to log event:", eventError);
    }

    // Log to admin actions
    await supabase.from("admin_actions_log").insert({
      admin_user_id: user.id,
      action_type: "join_support_thread",
      target_type: "conversation",
      target_id: conversationId,
      metadata: { ticket_id: ticketId },
    });

    // Insert system message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: "CSI Support has joined the conversation.",
      message_type: 'system',
      metadata: { ticket_id: ticketId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error joining thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to join thread" };
  }
}
