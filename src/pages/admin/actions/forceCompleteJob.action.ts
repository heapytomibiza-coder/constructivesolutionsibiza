/**
 * Admin action: Force complete a job via atomic RPC.
 * Bypasses the normal completion_requested gate but records
 * the transition in job_status_history with change_source = 'admin_override'.
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";

export async function forceCompleteJob(
  jobId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase.rpc("admin_force_complete_job", {
    p_job_id: jobId,
    p_reason: reason,
  });

  if (error) {
    console.error("Error force completing job:", error);
    const msg = error.message || "";
    if (msg.includes("not_authorized")) return { success: false, error: "Admin access required" };
    if (msg.includes("job_not_found")) return { success: false, error: "Job not found" };
    if (msg.includes("job_already_closed")) return { success: false, error: "Job is already completed or cancelled" };
    return { success: false, error: "Failed to complete job. Please try again." };
  }

  trackEvent("admin_force_completed_job", "admin", {}, { job_id: jobId });

  // Log admin action for admin audit trail
  await supabase.from("admin_actions_log").insert({
    admin_user_id: user.id,
    action_type: "force_complete_job",
    target_type: "job",
    target_id: jobId,
    metadata: { reason },
  });

  return { success: true };
}
