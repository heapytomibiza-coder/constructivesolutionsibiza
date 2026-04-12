/**
 * ENTRY POINT — Infrastructure providers only.
 *
 * Provider ownership:
 *   main.tsx  → ErrorBoundary, Suspense (crash recovery + loading)
 *   App.tsx   → QueryClient, BrowserRouter, SessionProvider, TooltipProvider (app logic)
 *
 * This split keeps infra concerns (error walls, loading states, monitoring)
 * separate from application-level routing and state.
 */

import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initMonitor } from "./lib/lighthouse-monitor";
import { supabase } from "./integrations/supabase/client";

// Defer monitoring init — must not block first paint
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => initMonitor({ supabase }));
} else {
  setTimeout(() => initMonitor({ supabase }), 2000);
}

// Auto-recover from stale chunk loading errors after new deployments.
// NOTE: Error message strings vary across browsers and bundlers (Vite, Webpack).
// These three patterns cover the known variants as of 2026-04.
const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Loading chunk',
  'Loading CSS chunk',
];

const CHUNK_RELOAD_KEY = 'chunk-reload';
const CHUNK_RELOAD_TTL_MS = 10_000; // prevent reload loops within 10 s

window.addEventListener('error', (event) => {
  if (!event.message || !CHUNK_ERROR_PATTERNS.some((p) => event.message.includes(p))) return;

  const prev = sessionStorage.getItem(CHUNK_RELOAD_KEY);
  if (prev) {
    const elapsed = Date.now() - Number(prev);
    if (elapsed < CHUNK_RELOAD_TTL_MS) return; // too recent — don't reload again
  }
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
});

// Clear reload flag on successful boot
sessionStorage.removeItem(CHUNK_RELOAD_KEY);

// Subtle loading indicator instead of blank screen
const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
      <div className="h-full w-1/2 animate-pulse bg-accent" />
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </ErrorBoundary>
);
