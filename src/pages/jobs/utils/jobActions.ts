/**
 * Pure helpers for job action visibility.
 * Used by JobTicketDetail and StageHero to ensure UI matches real DB/RPC rules.
 */

/** Client can cancel draft/ready/open directly. In-progress requires dispute flow. */
export function canCancelJob(status: string, isClient: boolean): boolean {
  if (!isClient) return false; // pros use request_job_cancellation RPC
  return ['draft', 'ready', 'open'].includes(status);
}

/** Jobs in draft or ready can be posted to the board. */
export function canPostJob(status: string): boolean {
  return ['draft', 'ready'].includes(status);
}

/** Pro can withdraw only from open jobs (no "assigned" status exists in DB). */
export function canWithdrawQuote(status: string): boolean {
  return status === 'open';
}
