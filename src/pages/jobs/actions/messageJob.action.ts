import { supabase } from "@/integrations/supabase/client";
import { UserError } from "@/shared/lib/userError";
import { trackEvent } from "@/lib/trackEvent";
import { requireProReady } from "@/guard/proReadiness";
import type { ProfessionalProfileData } from "@/hooks/useSessionSnapshot";

/**
 * Start or get existing conversation between a professional and a job.
 * 
 * Security: proId is derived from authenticated session, not accepted as param.
 * 
 * @param jobId - The job to message about
 * @param profile - Optional professional profile for pre-flight proReady check
 * @returns The conversation ID
 * @throws UserError for user-facing errors
 */
export async function startConversation(
  jobId: string,
  profile?: ProfessionalProfileData | null
): Promise<string> {
  // Get authenticated user - prevents spoofing proId
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new UserError("You must be signed in to message", "NOT_AUTHENTICATED");
  }

  // Pre-flight guard: check proReady before hitting DB
  // Only applied when profile is explicitly passed (undefined = skip check)
  if (profile !== undefined) {
    requireProReady(profile);
  }

  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_job_id: jobId,
    p_pro_id: user.id,
  });

  if (error) {
    const msg = error.message ?? "Unknown error";

    if (msg.includes("Cannot message your own job")) {
      throw new UserError("You cannot message your own job", "OWN_JOB");
    }
    if (msg.includes("not available")) {
      throw new UserError(
        "This job is no longer available for messaging",
        "JOB_NOT_AVAILABLE"
      );
    }

    // Wrap unexpected errors with user-friendly message (log original for debugging)
    console.error("[startConversation] Unexpected RPC error:", error);
    throw new UserError("Could not start conversation. Please try again.", "CONVO_CREATE_FAILED");
  }

  if (!data) {
    throw new Error("Conversation ID not returned");
  }

  trackEvent('conversation_started', 'professional', { jobId, conversationId: String(data) });

  return String(data);
}
