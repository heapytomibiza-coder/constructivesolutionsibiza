/**
 * @deprecated Use submitQuote with `previousQuoteId` instead.
 * Kept temporarily for any remaining imports — delegates to the unified path.
 */

import { submitQuote } from "./submitQuote.action";
import type { SubmitQuotePayload, SubmitQuoteResult } from "./submitQuote.action";

export async function reviseQuote(
  quoteId: string,
  currentRevision: number,
  payload: Omit<SubmitQuotePayload, "jobId"> & { jobId: string }
): Promise<SubmitQuoteResult> {
  return submitQuote({
    ...payload,
    previousQuoteId: quoteId,
    revisionNumber: currentRevision + 1,
  });
}
