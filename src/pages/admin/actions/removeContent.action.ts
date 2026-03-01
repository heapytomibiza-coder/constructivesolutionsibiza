/**
 * Admin action: Remove forum content
 * Deletes a forum post or reply. Logged for audit.
 */

import { supabase } from "@/integrations/supabase/client";

export type ContentType = "post" | "reply";

export async function removeContent(
  contentId: string,
  contentType: ContentType,
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

  // Soft delete: set deleted_at instead of hard DELETE
  const table = contentType === "post" ? "forum_posts" : "forum_replies";
  
  const { error: deleteError } = await supabase
    .from(table)
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    } as any)
    .eq("id", contentId);

  if (deleteError) {
    console.error(`Error soft-deleting ${contentType}:`, deleteError);
    return { success: false, error: "Failed to remove content. Please try again." };
  }

  // Log admin action
  const { error: logError } = await supabase.from("admin_actions_log").insert({
    admin_user_id: user.id,
    action_type: `remove_${contentType}`,
    target_type: contentType,
    target_id: contentId,
    metadata: { reason },
  });

  if (logError) {
    console.error("Error logging admin action:", logError);
  }

  return { success: true };
}
