/**
 * Create a support request from within a conversation
 */
import { supabase } from "@/integrations/supabase/client";

type IssueType = 'no_response' | 'no_show' | 'dispute' | 'payment' | 'safety_concern' | 'other';

interface CreateParams {
  conversationId: string;
  jobId?: string | null;
  issueType: IssueType;
  summary?: string;
  userRole: 'client' | 'professional';
}

interface CreateResult {
  success: boolean;
  ticketNumber?: string;
  error?: string;
}

export async function createSupportRequest(params: CreateParams): Promise<CreateResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check for existing open request (spam prevention)
    const { data: existing } = await supabase
      .from("support_requests")
      .select("id, ticket_number")
      .eq("conversation_id", params.conversationId)
      .not("status", "in", "(resolved,closed)")
      .limit(1);

    if (existing?.length) {
      return { 
        success: false, 
        error: "A support request is already open for this conversation" 
      };
    }

    // Auto-assign priority based on issue type
    const priority = params.issueType === 'safety_concern' ? 'high' 
      : params.issueType === 'no_show' ? 'high'
      : 'medium';

    // Insert support request
    const { data: request, error: requestError } = await supabase
      .from("support_requests")
      .insert({
        conversation_id: params.conversationId,
        job_id: params.jobId || null,
        created_by_user_id: user.id,
        created_by_role: params.userRole,
        issue_type: params.issueType,
        summary: params.summary?.trim() || null,
        priority,
        status: 'open',
      })
      .select("id, ticket_number")
      .single();

    if (requestError) {
      console.error("Error creating support request:", requestError);
      throw requestError;
    }

    // Insert event for audit trail
    const { error: eventError } = await supabase
      .from("support_request_events")
      .insert({
        support_request_id: request.id,
        event_type: 'created',
        actor_user_id: user.id,
        actor_role: params.userRole,
        metadata: { issue_type: params.issueType },
      });

    if (eventError) {
      console.error("Error creating event:", eventError);
    }

    // Insert system message into the conversation
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: params.conversationId,
        sender_id: user.id,
        body: `Support has been notified. Ticket ${request.ticket_number}`,
        message_type: 'system',
        metadata: { 
          support_request_id: request.id,
          ticket_number: request.ticket_number,
          issue_type: params.issueType,
        },
      });

    if (messageError) {
      console.error("Error creating system message:", messageError);
    }

    return { success: true, ticketNumber: request.ticket_number };
  } catch (error) {
    console.error("Error in createSupportRequest:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create support request" 
    };
  }
}
