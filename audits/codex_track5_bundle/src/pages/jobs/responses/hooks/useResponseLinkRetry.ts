/**
 * useResponseLinkRetry — one-shot silent retry for a missing/mismatched
 * quote ↔ response link.
 *
 * Trigger condition (all must be true):
 *   - viewer is the professional who owns the quote
 *   - quote exists, is not in a terminal state (withdrawn/rejected)
 *   - response is missing OR response.quote_id !== quote.id
 *
 * Loop prevention:
 *   - Module-level `Set` keyed by `${jobId}:${quoteId}` — each pair is
 *     attempted at most once per browser session.
 *   - `attemptedRef` guards against React Strict Mode double-invoke.
 *   - The mutation's own `isPending` would gate concurrent triggers in the
 *     same render cycle; the Set covers across renders / unmount-remount.
 *
 * Failure: logged with the same structured shape as submitQuote.action.ts
 * and a `quote_link_failed` analytics event (kind: "retry_*").
 *
 * Success: invalidates the responses cache so the sync badge flips to
 * "Visible to client" without a manual reload.
 *
 * Non-blocking: never throws; never affects rendering of the parent.
 */

import { useEffect, useRef } from "react";
import { useLinkQuoteToResponse } from "../mutations";
import { trackEvent } from "@/lib/trackEvent";

/** Browser-session-wide guard so a failed attempt isn't re-fired on every render. */
const attemptedKeys = new Set<string>();

interface Params {
  /** Authenticated user id. Retry is skipped when null. */
  userId: string | null | undefined;
  /** Job id for the quote. */
  jobId: string;
  /** The quote row (must belong to userId for retry to fire). */
  quote: {
    id: string;
    professional_id: string;
    status: string | null;
  } | null | undefined;
  /** The pro's own response row (or null if missing). */
  response: {
    quote_id: string | null;
  } | null | undefined;
  /** Whether the underlying response query has finished — avoids racing during initial load. */
  isResponseReady: boolean;
}

const TERMINAL_QUOTE_STATUSES = new Set(["withdrawn", "rejected"]);

export function useResponseLinkRetry({
  userId,
  jobId,
  quote,
  response,
  isResponseReady,
}: Params) {
  const link = useLinkQuoteToResponse();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!userId || !quote || !isResponseReady) return;
    if (quote.professional_id !== userId) return;
    if (TERMINAL_QUOTE_STATUSES.has(quote.status ?? "")) return;

    const isLinked = !!response && response.quote_id === quote.id;
    if (isLinked) return;

    const key = `${jobId}:${quote.id}`;
    if (attemptedRef.current || attemptedKeys.has(key)) return;
    if (link.isPending) return;

    attemptedRef.current = true;
    attemptedKeys.add(key);

    const context = {
      scope: "useResponseLinkRetry" as const,
      jobId,
      quoteId: quote.id,
      professionalId: userId,
      previousResponseQuoteId: response?.quote_id ?? null,
      quoteStatus: quote.status ?? null,
      timestamp: new Date().toISOString(),
    };

    link.mutate(
      { jobId, quoteId: quote.id },
      {
        onError: (err) => {
          const isErrShape =
            typeof err === "object" && err !== null;
          const code =
            isErrShape && "code" in err
              ? (err as { code?: unknown }).code ?? null
              : null;
          const message =
            err instanceof Error
              ? err.message
              : isErrShape && "message" in err
              ? String((err as { message?: unknown }).message ?? "")
              : String(err);
          const details =
            isErrShape && "details" in err
              ? (err as { details?: unknown }).details ?? null
              : null;
          const hint =
            isErrShape && "hint" in err
              ? (err as { hint?: unknown }).hint ?? null
              : null;

          console.warn(
            "[useResponseLinkRetry] silent retry failed (non-blocking)",
            {
              ...context,
              kind: "retry_failed",
              errorCode: code,
              errorMessage: message,
              errorDetails: details,
              errorHint: hint,
            },
          );
          trackEvent(
            "quote_link_failed",
            "professional",
            {
              kind: "retry_failed",
              error_code: typeof code === "string" ? code : "unknown",
            },
            { job_id: jobId },
          );
          // Key stays in the Set — we do NOT retry again this session.
        },
      },
    );
    // Intentionally exclude `link` (mutation object identity) from deps —
    // we only want to react to the data shape that defines the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    jobId,
    quote?.id,
    quote?.status,
    quote?.professional_id,
    response?.quote_id,
    isResponseReady,
  ]);
}

/** Test-only helper — clears the in-memory attempt guard. */
export function __resetResponseLinkRetryGuard() {
  attemptedKeys.clear();
}
