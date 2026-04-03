/**
 * submitQuote — Single source of truth for all quote submissions.
 * Calls the atomic `submit_quote_with_items` RPC which handles:
 *   - rate limiting (20/day per pro)
 *   - quote insert + line items in one transaction
 *   - optional revision (marks previous quote as "revised")
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";
import type { QuotePriceType } from "../types";

export interface QuoteLineItemPayload {
  description: string;
  quantity: number;
  unit_price: number;
}

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
  notes?: string | null;
  vatPercent?: number | null;
  subtotal?: number | null;
  total?: number | null;
  revisionNumber?: number;
  /** If revising, pass the previous quote ID to mark it as "revised" atomically. */
  previousQuoteId?: string | null;
  lineItems?: QuoteLineItemPayload[];
}

export interface SubmitQuoteResult {
  success: boolean;
  quoteId?: string;
  error?: string;
}

export async function submitQuote(
  payload: SubmitQuotePayload
): Promise<SubmitQuoteResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: quoteId, error } = await supabase.rpc('submit_quote_with_items', {
    p_job_id: payload.jobId,
    p_price_type: payload.priceType,
    p_price_fixed: payload.priceFixed ?? null,
    p_price_min: payload.priceMin ?? null,
    p_price_max: payload.priceMax ?? null,
    p_hourly_rate: payload.hourlyRate ?? null,
    p_time_estimate_days: payload.timeEstimateDays ?? null,
    p_start_date_estimate: payload.startDateEstimate ?? null,
    p_scope_text: payload.scopeText || '',
    p_exclusions_text: payload.exclusionsText ?? null,
    p_notes: payload.notes ?? null,
    p_vat_percent: payload.vatPercent ?? 0,
    p_subtotal: payload.subtotal ?? null,
    p_total: payload.total ?? null,
    p_revision_number: payload.revisionNumber ?? 1,
    p_previous_quote_id: payload.previousQuoteId ?? null,
    p_line_items: payload.lineItems ?? [],
  });

  if (error) {
    console.error("Error submitting quote:", error);
    if (error.message?.includes("Daily quote limit")) {
      return { success: false, error: "Daily quote limit reached. Please try again tomorrow." };
    }
    if (error.message?.includes("duplicate key")) {
      return { success: false, error: "You already have a quote for this job" };
    }
    return { success: false, error: "Failed to submit quote" };
  }

  const isRevision = !!payload.previousQuoteId;
  trackEvent(
    isRevision ? "quote_revised" : "quote_submitted",
    "professional",
    { type: "unified" },
    { job_id: payload.jobId },
  );

  return { success: true, quoteId: quoteId as string };
}
