import { supabase } from "@/integrations/supabase/client";
import { UserError } from "@/shared/lib/userError";
import { getProReadiness, getProReadinessMessage } from "@/guard/proReadiness";
import type { ProfessionalProfileData } from "@/hooks/useSessionSnapshot";

/**
 * Verify professional is ready before allowing marketplace actions.
 * Throws UserError with code PRO_NOT_READY if requirements not met.
 */
export function requireProReady(
  profile: ProfessionalProfileData | null
): void {
  const { isReady, reasons } = getProReadiness(profile);
  
  if (!isReady) {
    throw new UserError(getProReadinessMessage(reasons), "PRO_NOT_READY");
  }
}

/**
 * Start or get existing conversation between a professional and a job.
 * 
 * @param jobId - The job to message about
 * @param proId - The professional user ID
 * @param profile - Optional professional profile for pre-flight proReady check
 * @returns The conversation ID
 * @throws UserError for user-facing errors
 */
export async function startConversation(
  jobId: string,
  proId: string,
  profile?: ProfessionalProfileData | null
): Promise<string> {
  // Pre-flight guard: check proReady before hitting DB
  // Only applied when profile is explicitly passed (undefined = skip check)
  if (profile !== undefined) {
    requireProReady(profile);
  }

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

  return String(data);
}
