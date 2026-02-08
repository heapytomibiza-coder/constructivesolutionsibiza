/**
 * Admin action: Archive a job
 * Removes job from marketplace but preserves data for audit.
 */

import { supabase } from "@/integrations/supabase/client";

export async function archiveJob(
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

  // Update job status to archived
  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "archived",
      is_publicly_listed: false,
    })
    .eq("id", jobId)
    .neq("status", "archived"); // Can't archive already archived jobs

  if (updateError) {
    console.error("Error archiving job:", updateError);
    return { success: false, error: updateError.message };
  }

  // Log admin action
  const { error: logError } = await supabase.from("admin_actions_log").insert({
    admin_user_id: user.id,
    action_type: "archive_job",
    target_type: "job",
    target_id: jobId,
    metadata: { reason },
  });

  if (logError) {
    console.error("Error logging admin action:", logError);
  }

  return { success: true };
}
