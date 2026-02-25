/**
 * LIGHTHOUSE MONITOR
 *
 * Automatic error tracking, network failure detection, page view telemetry,
 * and in-memory context for the Report Issue widget.
 *
 * Usage: import { initMonitor } from './lighthouse-monitor';
 *        initMonitor({ supabase });
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MonitorConfig {
  supabase: SupabaseClient;
  flushIntervalMs?: number;
  maxBufferSize?: number;
}

interface ErrorEvent {
  error_type: 'runtime' | 'network' | 'console' | 'promise';
  message: string;
  stack?: string;
  url: string;
  route: string;
  browser: string;
  viewport: string;
  metadata?: Record<string, unknown>;
}

interface NetworkFailure {
  request_url: string;
  method: string;
  status_code: number | null;
  error_message: string;
  route: string;
  browser: string;
}

interface PageView {
  url: string;
  route: string;
  load_time_ms: number | null;
  browser: string;
  viewport: string;
}

export interface MonitorContext {
  page: string;
  browser: string;
  viewport: string;
  recentErrors: ErrorEvent[];
  recentRequests: Array<{ url: string; method: string; status: number | null; ts: string }>;
  recentConsole: string[];
}

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

let client: SupabaseClient | null = null;
let initialized = false;

const errorBuffer: ErrorEvent[] = [];
const networkBuffer: NetworkFailure[] = [];
const pageViewBuffer: PageView[] = [];

// Context ring buffers for the Report widget
const recentErrors: ErrorEvent[] = [];
const recentRequests: Array<{ url: string; method: string; status: number | null; ts: string }> = [];
const recentConsole: string[] = [];

const MAX_CONTEXT_ERRORS = 5;
const MAX_CONTEXT_REQUESTS = 10;
const MAX_CONTEXT_CONSOLE = 10;

let lastRoute = '';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getBrowser(): string {
  return navigator.userAgent.slice(0, 200);
}

function getViewport(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

function getRoute(): string {
  return window.location.pathname;
}

async function getUserId(): Promise<string | null> {
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function pushCapped<T>(arr: T[], item: T, max: number) {
  arr.push(item);
  if (arr.length > max) arr.shift();
}

/* ------------------------------------------------------------------ */
/*  Flush buffers to database                                          */
/* ------------------------------------------------------------------ */

async function flush() {
  if (!client) return;
  const userId = await getUserId();
  if (!userId) return; // Only track authenticated users (RLS requires user_id)

  try {
    // Flush errors
    if (errorBuffer.length > 0) {
      const rows = errorBuffer.splice(0, errorBuffer.length).map((e) => ({
        user_id: userId,
        ...e,
      }));
      await client.from('error_events').insert(rows);
    }

    // Flush network failures
    if (networkBuffer.length > 0) {
      const rows = networkBuffer.splice(0, networkBuffer.length).map((n) => ({
        user_id: userId,
        ...n,
      }));
      await client.from('network_failures').insert(rows);
    }

    // Flush page views
    if (pageViewBuffer.length > 0) {
      const rows = pageViewBuffer.splice(0, pageViewBuffer.length).map((p) => ({
        user_id: userId,
        ...p,
      }));
      await client.from('page_views').insert(rows);
    }
  } catch (err) {
    // Avoid infinite loops — don't capture flush errors
    console.warn('[Lighthouse] Failed to flush:', err);
  }
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function hookErrors() {
  // Runtime errors
  const prevOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const evt: ErrorEvent = {
      error_type: 'runtime',
      message: String(message),
      stack: error?.stack,
      url: window.location.href,
      route: getRoute(),
      browser: getBrowser(),
      viewport: getViewport(),
      metadata: { source, lineno, colno },
    };
    errorBuffer.push(evt);
    pushCapped(recentErrors, evt, MAX_CONTEXT_ERRORS);
    if (prevOnError) prevOnError(message, source, lineno, colno, error);
  };

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message ?? String(event.reason);
    const evt: ErrorEvent = {
      error_type: 'promise',
      message: msg,
      stack: event.reason?.stack,
      url: window.location.href,
      route: getRoute(),
      browser: getBrowser(),
      viewport: getViewport(),
    };
    errorBuffer.push(evt);
    pushCapped(recentErrors, evt, MAX_CONTEXT_ERRORS);
  });
}

// React dev-mode warnings we want to ignore (not real errors)
const IGNORED_PATTERNS = [
  'Function components cannot be given refs',
  'Warning: React does not recognize',
  'Warning: Each child in a list should have a unique',
  'Warning: validateDOMNesting',
];

function hookConsole() {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');

    // Skip known React dev warnings — they're not real errors
    if (IGNORED_PATTERNS.some((p) => msg.includes(p))) {
      originalError.apply(console, args);
      return;
    }

    const evt: ErrorEvent = {
      error_type: 'console',
      message: msg.slice(0, 2000),
      url: window.location.href,
      route: getRoute(),
      browser: getBrowser(),
      viewport: getViewport(),
    };
    errorBuffer.push(evt);
    pushCapped(recentErrors, evt, MAX_CONTEXT_ERRORS);
    pushCapped(recentConsole, msg.slice(0, 500), MAX_CONTEXT_CONSOLE);
    originalError.apply(console, args);
  };
}

function hookFetch() {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = init?.method ?? 'GET';

    // Track all requests for context
    pushCapped(recentRequests, { url: url.slice(0, 500), method, status: null, ts: new Date().toISOString() }, MAX_CONTEXT_REQUESTS);

    try {
      const response = await originalFetch(input, init);

      // Update status in context
      const last = recentRequests[recentRequests.length - 1];
      if (last && last.url === url.slice(0, 500)) last.status = response.status;

      if (response.status >= 400) {
        // Don't track our own monitoring inserts to avoid loops
        if (url.includes('/error_events') || url.includes('/tester_reports') ||
            url.includes('/page_views') || url.includes('/network_failures')) {
          return response;
        }

        const failure: NetworkFailure = {
          request_url: url.slice(0, 1000),
          method,
          status_code: response.status,
          error_message: response.statusText,
          route: getRoute(),
          browser: getBrowser(),
        };
        networkBuffer.push(failure);
      }
      return response;
    } catch (err) {
      const failure: NetworkFailure = {
        request_url: url.slice(0, 1000),
        method,
        status_code: null,
        error_message: (err as Error).message ?? 'Network error',
        route: getRoute(),
        browser: getBrowser(),
      };
      networkBuffer.push(failure);
      throw err;
    }
  };
}

function trackPageViews() {
  // Capture initial page load time
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const loadTime = nav ? Math.round(nav.loadEventEnd - nav.startTime) : null;
    pageViewBuffer.push({
      url: window.location.href,
      route: getRoute(),
      load_time_ms: loadTime && loadTime > 0 ? loadTime : null,
      browser: getBrowser(),
      viewport: getViewport(),
    });
  } catch {
    // Performance API not available
  }

  lastRoute = getRoute();

  // Poll for SPA route changes
  setInterval(() => {
    const current = getRoute();
    if (current !== lastRoute) {
      lastRoute = current;
      pageViewBuffer.push({
        url: window.location.href,
        route: current,
        load_time_ms: null,
        browser: getBrowser(),
        viewport: getViewport(),
      });
    }
  }, 1000);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function initMonitor(config: MonitorConfig) {
  if (initialized) return;
  initialized = true;
  client = config.supabase;

  const flushInterval = config.flushIntervalMs ?? 5000;
  const maxBuffer = config.maxBufferSize ?? 10;

  hookErrors();
  hookConsole();
  hookFetch();

  // Delay page view tracking so Performance API has data
  setTimeout(trackPageViews, 2000);

  // Periodic flush
  setInterval(() => {
    const total = errorBuffer.length + networkBuffer.length + pageViewBuffer.length;
    if (total > 0) flush();
  }, flushInterval);

  // Flush when buffer gets large
  const checkSize = () => {
    const total = errorBuffer.length + networkBuffer.length + pageViewBuffer.length;
    if (total >= maxBuffer) flush();
  };
  setInterval(checkSize, 1000);

  console.log('[Lighthouse] Monitor initialized');
}

export function getMonitorContext(): MonitorContext {
  return {
    page: window.location.href,
    browser: getBrowser(),
    viewport: getViewport(),
    recentErrors: [...recentErrors],
    recentRequests: [...recentRequests],
    recentConsole: [...recentConsole],
  };
}
