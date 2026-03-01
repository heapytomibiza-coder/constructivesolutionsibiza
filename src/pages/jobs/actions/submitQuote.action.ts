/**
 * Submit a new quote for a job.
 * Pro must have a conversation on this job (enforced by RLS).
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";
import type { QuotePriceType } from "../types";

export interface SubmitQuotePayload {
  jobId: string;
  priceType: QuotePriceType;
  priceFixed?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  hourlyRate?: number | null;
  timeEstimateDays?: number | null;
  startDateEstimate?: string | null;
  scopeText: string;
  exclusionsText?: string | null;
}

export async function submitQuote(
  payload: SubmitQuotePayload
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("quotes").insert({
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
  });

  if (error) {
    console.error("Error submitting quote:", error);
    if (error.message?.includes("duplicate key")) {
      return { success: false, error: "You already have a quote for this job" };
    }
    return { success: false, error: "Failed to submit quote" };
  }

  trackEvent("quote_submitted", "professional", { jobId: payload.jobId });
  return { success: true };
}
