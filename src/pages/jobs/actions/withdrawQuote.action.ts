/**
 * Withdraw a quote (pro-side action).
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";

export async function withdrawQuote(
  quoteId: string,
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("quotes")
    .update({ status: "withdrawn" })
    .eq("id", quoteId)
    .eq("professional_id", user.id)
    .in("status", ["submitted", "revised"]);

  if (error) {
    console.error("Error withdrawing quote:", error);
    return { success: false, error: "Failed to withdraw quote" };
  }

  trackEvent("quote_withdrawn", "professional", {}, { job_id: jobId });
  return { success: true };
}
