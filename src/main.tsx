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

// Auto-recover from stale chunk loading errors after new deployments
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Loading CSS chunk')
  ) {
    const reloaded = sessionStorage.getItem('chunk-reload');
    if (!reloaded) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
  }
});
// Clear reload flag on successful load
sessionStorage.removeItem('chunk-reload');

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
