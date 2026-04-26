/**
 * Public surface for the Track 5 Responses UI scaffold.
 *
 * Routes consume:
 *   - JobResponsesPage (default route component)
 * Other pages (job detail) consume:
 *   - ProResponseActionBar
 */

export { ResponsesInbox } from "./components/ResponsesInbox";
export { ResponseCard } from "./components/ResponseCard";
export { ResponseStateTimeline } from "./components/ResponseStateTimeline";
export { HireConfirmModal } from "./components/HireConfirmModal";
export { ProResponseActionBar } from "./components/ProResponseActionBar";
export { useJobResponses } from "./queries/useJobResponses";
export { useMyResponse } from "./queries/useMyResponse";
export {
  useExpressInterest,
  useLinkQuoteToResponse,
  useWithdrawResponse,
  useShortlistResponse,
  useDeclineResponse,
  useAcceptResponse,
} from "./mutations";
export type {
  ResponseRow,
  ResponseStatus,
  ResponseProSummary,
  ResponseQuoteSummary,
  EnrichedResponse,
} from "./types";
