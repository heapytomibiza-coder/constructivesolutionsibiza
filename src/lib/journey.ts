/**
 * USER JOURNEY TRACE — diagnostic-only client tracer.
 *
 * Fire-and-forget. Never throws. Never blocks UI.
 * Privacy rules: no message bodies, no passwords, no emails, no full
 * query-string URLs in payloads. Routes are stripped of search params.
 *
 * Buffered: max 50 events, flushed every 5s, on visibilitychange=hidden,
 * and on beforeunload. If buffer overflows, a single
 * `journey_buffer_overflow` event is recorded.
 */

import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "cs_journey_session";
const BUFFER_MAX = 50;
const FLUSH_INTERVAL_MS = 5000;

export const JOURNEY_EVENTS = {
  // Auth
  AUTH_INIT: "auth_init",
  AUTH_SUCCESS: "auth_success",
  AUTH_FAILURE: "auth_failure",
  TOKEN_REFRESH: "token_refresh",
  LOGOUT_TRIGGERED: "logout_triggered",
  USER_UPDATED: "user_updated",

  // Jobs
  JOBS_LOAD_START: "jobs_load_start",
  JOBS_LOAD_SUCCESS: "jobs_load_success",
  JOBS_LOAD_FAILURE: "jobs_load_failure",

  // Matching
  MATCHING_START: "matching_start",
  MATCHING_SUCCESS: "matching_success",
  MATCHING_EMPTY: "matching_empty",
  MATCHING_FAILURE: "matching_failure",

  // Navigation
  ROUTE_CHANGE: "route_change",
  REDIRECT_TRIGGERED: "redirect_triggered",

  // Errors
  JS_ERROR: "js_error",
  UNHANDLED_REJECTION: "unhandled_rejection",
  REACT_ERROR_BOUNDARY: "react_error_boundary",
  SUPABASE_ERROR: "supabase_error",

  // Internal
  BUFFER_OVERFLOW: "journey_buffer_overflow",
} as const;

export type JourneyEventType =
  (typeof JOURNEY_EVENTS)[keyof typeof JOURNEY_EVENTS];

interface QueuedEvent {
  event_type: string;
  route?: string;
  action?: string;
  payload?: Record<string, unknown>;
  success?: boolean;
  error_message?: string;
  error_code?: string;
  ts: string;
}

let buffer: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;
let overflowed = false;

/** Strip query string and hash; cap length. */
function safeRoute(input?: string | null): string | undefined {
  if (!input) return undefined;
  try {
    const url = input.startsWith("http")
      ? new URL(input)
      : new URL(input, "http://x");
    return url.pathname.slice(0, 200);
  } catch {
    return String(input).split("?")[0].split("#")[0].slice(0, 200);
  }
}

function currentRoute(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return safeRoute(window.location.pathname);
}

/** Generate a UUID v4 with crypto when available. */
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return "sx-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const fresh = uuid();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    try {
      const existing = window.sessionStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
      const fresh = uuid();
      window.sessionStorage.setItem(STORAGE_KEY, fresh);
      return fresh;
    } catch {
      return uuid();
    }
  }
}

/** Strip likely-PII keys from a payload before sending. */
function sanitizePayload(
  payload?: Record<string, unknown>
): Record<string, unknown> {
  if (!payload) return {};
  const banned = new Set([
    "email",
    "password",
    "token",
    "access_token",
    "refresh_token",
    "message",
    "body",
    "content",
    "phone",
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (banned.has(k.toLowerCase())) continue;
    if (typeof v === "string" && v.length > 500) {
      out[k] = v.slice(0, 500) + "…";
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const sessionId = getOrCreateSessionId();
  const batch = buffer.splice(0, buffer.length);

  for (const ev of batch) {
    try {
      // Fire-and-forget — Supabase client returns a thenable promise
      void supabase.rpc("journey_log_event" as never, {
        p_session_id: sessionId,
        p_event_type: ev.event_type,
        p_route: ev.route ?? null,
        p_action: ev.action ?? null,
        p_payload: (ev.payload ?? {}) as never,
        p_success: ev.success ?? true,
        p_error_message: ev.error_message ?? null,
        p_error_code: ev.error_code ?? null,
      } as never);
    } catch {
      /* swallow */
    }
  }
}

export function logJourneyEvent(
  eventType: JourneyEventType | string,
  opts: {
    route?: string;
    action?: string;
    payload?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
    errorCode?: string;
  } = {}
): void {
  try {
    if (buffer.length >= BUFFER_MAX) {
      if (!overflowed) {
        overflowed = true;
        buffer.push({
          event_type: JOURNEY_EVENTS.BUFFER_OVERFLOW,
          route: currentRoute(),
          payload: { dropped_after: BUFFER_MAX },
          success: false,
          ts: new Date().toISOString(),
        });
        // Force a flush to avoid losing more
        void flush();
      }
      return;
    }
    overflowed = false;

    buffer.push({
      event_type: eventType,
      route: safeRoute(opts.route) ?? currentRoute(),
      action: opts.action,
      payload: sanitizePayload(opts.payload),
      success: opts.success,
      error_message: opts.errorMessage,
      error_code: opts.errorCode,
      ts: new Date().toISOString(),
    });
  } catch {
    /* never throw */
  }
}

export function touchJourneySession(route?: string): void {
  try {
    const sessionId = getOrCreateSessionId();
    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : "";
    const vp =
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : "";
    void supabase.rpc("journey_touch_session" as never, {
      p_session_id: sessionId,
      p_route: safeRoute(route) ?? currentRoute() ?? null,
      p_user_agent: ua,
      p_viewport: vp,
    } as never);
  } catch {
    /* swallow */
  }
}

/** Initialize global handlers + flush timer. Idempotent. */
export function initJourneyTracer(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Initial session touch
  touchJourneySession();

  // Periodic flush
  flushTimer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);

  // Flush on hide / unload.
  //
  // NOTE on navigator.sendBeacon: we intentionally do NOT use sendBeacon
  // for the final flush. The Supabase RPC endpoint requires the
  // `Authorization: Bearer <jwt>` and `apikey` headers plus a JSON body,
  // and sendBeacon's `Blob` payload cannot set custom request headers.
  // The `keepalive: true` fetch option is also unreliable across browsers
  // for cross-origin POSTs with auth headers and is capped at 64KB total.
  //
  // Instead we rely on `visibilitychange=hidden` (fired before tab close
  // on all modern browsers including iOS Safari) to trigger an in-flight
  // fetch via the Supabase client. Limitation: a small tail of events
  // (≤ 5s of activity) may be lost on hard browser kill / process crash.
  // This is acceptable for a diagnostic tracer.
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => void flush());
  window.addEventListener("beforeunload", () => void flush());

  // JS errors
  window.addEventListener("error", (e) => {
    logJourneyEvent(JOURNEY_EVENTS.JS_ERROR, {
      success: false,
      errorMessage: e.message?.slice(0, 500),
      payload: {
        filename: e.filename?.slice(0, 200),
        lineno: e.lineno,
        colno: e.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    let msg = "unknown";
    try {
      msg =
        typeof e.reason === "string"
          ? e.reason
          : e.reason?.message ?? JSON.stringify(e.reason);
    } catch {
      /* ignore */
    }
    logJourneyEvent(JOURNEY_EVENTS.UNHANDLED_REJECTION, {
      success: false,
      errorMessage: String(msg).slice(0, 500),
    });
  });
}

export function shutdownJourneyTracer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  void flush();
  initialized = false;
}
