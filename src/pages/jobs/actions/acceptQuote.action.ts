/**
 * Accept a quote on a job.
 * Sets quote → accepted, rejects others, assigns pro, sets job → in_progress.
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";

const ASSIGNABLE_STATUSES = ["open", "posted"] as const;

export async function acceptQuote(
  quoteId: string,
  jobId: string,
  professionalId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify job ownership + status
  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, user_id, status, assigned_professional_id")
    .eq("id", jobId)
    .single();

  if (fetchErr || !job) return { success: false, error: "Job not found" };
  if (job.user_id !== user.id) return { success: false, error: "Not authorized" };
  if (job.assigned_professional_id) return { success: false, error: "Job already has an assigned professional" };
  if (!ASSIGNABLE_STATUSES.includes(job.status as typeof ASSIGNABLE_STATUSES[number])) {
    return { success: false, error: "Job must be open to accept a quote" };
  }

  // Accept the quote
  const { error: acceptErr } = await supabase
    .from("quotes")
    .update({ status: "accepted" })
    .eq("id", quoteId);

  if (acceptErr) {
    console.error("Error accepting quote:", acceptErr);
    return { success: false, error: "Failed to accept quote" };
  }

  // Reject all other active quotes on this job
  await supabase
    .from("quotes")
    .update({ status: "rejected" })
    .eq("job_id", jobId)
    .neq("id", quoteId)
    .in("status", ["submitted", "revised"]);

  // Assign professional + move job to in_progress
  const { error: assignErr } = await supabase
    .from("jobs")
    .update({
      assigned_professional_id: professionalId,
      status: "in_progress",
    })
    .eq("id", jobId)
    .eq("user_id", user.id)
    .in("status", [...ASSIGNABLE_STATUSES])
    .is("assigned_professional_id", null);

  if (assignErr) {
    console.error("Error assigning professional:", assignErr);
    return { success: false, error: "Quote accepted but assignment failed" };
  }

  trackEvent("quote_accepted", "client", { jobId, quoteId, proId: professionalId });
  return { success: true };
}
