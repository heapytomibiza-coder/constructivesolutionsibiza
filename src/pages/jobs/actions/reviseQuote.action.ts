/**
 * Revise an existing quote.
 * Creates a new revision by inserting with incremented revision_number.
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";
import type { SubmitQuotePayload } from "./submitQuote.action";

export async function reviseQuote(
  quoteId: string,
  currentRevision: number,
  payload: Omit<SubmitQuotePayload, "jobId"> & { jobId: string }
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Mark old quote as revised
  const { error: updateErr } = await supabase
    .from("quotes")
    .update({ status: "revised" })
    .eq("id", quoteId)
    .eq("professional_id", user.id);

  if (updateErr) {
    console.error("Error marking quote revised:", updateErr);
    return { success: false, error: "Failed to revise quote" };
  }

  // Insert new revision
  const { error: insertErr } = await supabase.from("quotes").insert({
    job_id: payload.jobId,
    professional_id: user.id,
    price_type: payload.priceType,
    price_fixed: payload.priceFixed ?? null,
    price_min: payload.priceMin ?? null,
    price_max: payload.priceMax ?? null,
    hourly_rate: payload.hourlyRate ?? null,
    time_estimate_days: payload.timeEstimateDays ?? null,
    start_date_estimate: payload.startDateEstimate ?? null,
    scope_text: payload.scopeText,
    exclusions_text: payload.exclusionsText ?? null,
    revision_number: currentRevision + 1,
  });

  if (insertErr) {
    console.error("Error inserting revised quote:", insertErr);
    return { success: false, error: "Failed to create revised quote" };
  }

  trackEvent("quote_revised", "professional", {}, { job_id: payload.jobId });
  return { success: true };
}
