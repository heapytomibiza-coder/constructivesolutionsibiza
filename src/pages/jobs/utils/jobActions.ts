/**
 * Unified eligibility helpers for job actions.
 * Used by JobTicketDetail and StageHero to ensure UI matches DB/RPC rules.
 *
 * Decision: 'ready' is a UI-only concept (not in DB CHECK constraint).
 * DB statuses: draft, open, in_progress, completed, cancelled.
 */

/** Client can cancel draft/open directly. In-progress requires dispute flow. */
export function canCancelJob(status: string, isClient: boolean): boolean {
  if (!isClient) return false; // pros use request_job_cancellation RPC
  return ['draft', 'open'].includes(status);
}

/** Only draft jobs can be posted to the board. */
export function canPostJob(status: string): boolean {
  return status === 'draft';
}

/** Pro can withdraw only from open jobs. */
export function canWithdrawQuote(status: string): boolean {
  return status === 'open';
}

/** Pro can request completion on in_progress jobs they're assigned to. */
export function canRequestCompletion(status: string, isPro: boolean, isAssignedPro: boolean): boolean {
  return isPro && isAssignedPro && status === 'in_progress';
}

/** Client can confirm completion after pro has requested it. */
export function canConfirmCompletion(status: string, isClient: boolean, hasCompletionRequest: boolean): boolean {
  return isClient && status === 'in_progress' && hasCompletionRequest;
}

/** Pro can request cancellation on in_progress jobs they're assigned to. */
export function canRequestCancellation(status: string, isPro: boolean, isAssignedPro: boolean): boolean {
  return isPro && isAssignedPro && status === 'in_progress';
}

/** Client can respond to a cancellation request. */
export function canRespondToCancellation(status: string, isClient: boolean, hasCancellationRequest: boolean): boolean {
  return isClient && status === 'in_progress' && hasCancellationRequest;
}
