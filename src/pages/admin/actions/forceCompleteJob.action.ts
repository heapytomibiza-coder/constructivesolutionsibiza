/**
 * Admin action: Force complete a job
 * Used when a job is stuck and needs to be marked as completed by admin.
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

  // Verify admin role
  const { data: hasAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (!hasAdmin) {
    return { success: false, error: "Admin access required" };
  }

  // Update job status to completed
  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .in("status", ["open", "in_progress"]); // Can only force complete non-completed jobs

  if (updateError) {
    console.error("Error force completing job:", updateError);
    return { success: false, error: "Failed to complete job. Please try again." };
  }

  trackEvent('admin_force_completed_job', 'admin', { jobId });

  // Log admin action
  const { error: logError } = await supabase.from("admin_actions_log").insert({
    admin_user_id: user.id,
    action_type: "force_complete_job",
    target_type: "job",
    target_id: jobId,
    metadata: { reason },
  });

  if (logError) {
    console.error("Error logging admin action:", logError);
  }

  return { success: true };
}
