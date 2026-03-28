/**
 * Accept a quote on a job.
 * Uses a transactional RPC to atomically: accept quote, reject others, assign pro, set job → in_progress.
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";

export async function acceptQuote(
  quoteId: string,
  jobId: string,
  professionalId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.rpc("accept_quote_and_assign" as any, {
    p_quote_id: quoteId,
    p_job_id: jobId,
    p_professional_id: professionalId,
  });

  if (error) {
    console.error("Error in accept_quote_and_assign:", error);

    // Map RPC exceptions to user-friendly messages
    const msg = error.message || "";
    if (msg.includes("not_authorized")) return { success: false, error: "Not authorized" };
    if (msg.includes("job_not_found")) return { success: false, error: "Job not found" };
    if (msg.includes("job_already_assigned")) return { success: false, error: "Job already has an assigned professional" };
    if (msg.includes("job_not_assignable")) return { success: false, error: "Job must be open to accept a quote" };
    if (msg.includes("quote_not_found")) return { success: false, error: "Quote not found" };
    if (msg.includes("quote_not_acceptable")) return { success: false, error: "Quote is not in an acceptable status" };

    return { success: false, error: "Failed to accept quote" };
  }

  trackEvent("quote_accepted", "client", { quote_id: quoteId, pro_id: professionalId }, { job_id: jobId });
  return { success: true };
}
