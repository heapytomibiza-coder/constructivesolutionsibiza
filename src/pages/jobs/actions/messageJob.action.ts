import { supabase } from "@/integrations/supabase/client";
import { UserError } from "@/shared/lib/userError";

/**
 * Start or get existing conversation between a professional and a job.
 * 
 * @param jobId - The job to message about
 * @param proId - The professional user ID
 * @returns The conversation ID
 * @throws UserError for user-facing errors
 */
export async function startConversation(
  jobId: string,
  proId: string
): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    p_job_id: jobId,
    p_pro_id: proId,
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

    // Re-throw original error for unexpected cases
    throw error;
  }

  if (!data) {
    throw new Error("Conversation ID not returned");
  }

  return data as string;
}
