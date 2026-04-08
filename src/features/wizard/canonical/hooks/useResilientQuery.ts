/**
 * useResilientQuery — wrapper around React Query that enforces:
 * - Configurable timeout (default 5s) via AbortController
 * - Reduced retry count (1)
 * - onTimeout / onFallback callbacks
 * - Auto-tracking of timeout/failure events
 */

import { useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/trackEvent';

interface ResilientQueryOptions<TData> {
  queryKey: QueryKey;
  queryFn: (signal: AbortSignal) => Promise<TData>;
  /** Timeout in ms before fallback triggers (default 5000) */
  timeoutMs?: number;
  /** Wizard step name for tracking */
  stepName: string;
  /** Called when timeout fires — use to render fallback UI */
  onTimeout?: () => void;
  /** Standard React Query options (staleTime, enabled, etc.) */
  queryOptions?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn' | 'retry'>;
}

export function useResilientQuery<TData>({
  queryKey,
  queryFn,
  timeoutMs = 5000,
  stepName,
  onTimeout,
  queryOptions,
}: ResilientQueryOptions<TData>) {
  const [timedOut, setTimedOut] = useState(false);
  const timeoutFiredRef = useRef(false);

  const query = useQuery<TData, Error>({
    queryKey,
    queryFn: ({ signal }) => {
      // Layer an AbortController with a timeout on top of React Query's signal
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);

      // If React Query's own signal aborts, forward it
      signal?.addEventListener('abort', () => controller.abort('cancelled'));

      return queryFn(controller.signal).finally(() => clearTimeout(timer));
    },
    retry: 1,
    retryDelay: 1000,
    ...queryOptions,
  });

  // Timeout detection: if still loading after timeoutMs, trigger fallback
  useEffect(() => {
    if (!query.isLoading || timeoutFiredRef.current) return;

    const timer = setTimeout(() => {
      if (query.isLoading && !timeoutFiredRef.current) {
        timeoutFiredRef.current = true;
        setTimedOut(true);
        trackEvent('wizard_step_timeout', 'client', {
          step: stepName,
          timeout_ms: timeoutMs,
        });
        onTimeout?.();
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [query.isLoading, timeoutMs, stepName, onTimeout]);

  // Reset timeout state when query key changes
  useEffect(() => {
    timeoutFiredRef.current = false;
    setTimedOut(false);
  }, [JSON.stringify(queryKey)]);

  // Track errors
  useEffect(() => {
    if (query.isError && query.error) {
      trackEvent('wizard_step_fallback', 'client', {
        step: stepName,
        tier: 'C',
        error: query.error.message,
      });
    }
  }, [query.isError, query.error, stepName]);

  return {
    ...query,
    timedOut,
    /** True when data should come from fallback (timeout or error after retries) */
    useFallback: timedOut || (query.isError && !query.isLoading),
  };
}
