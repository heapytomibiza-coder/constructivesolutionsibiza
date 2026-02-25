import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initMonitor } from "./lib/lighthouse-monitor";
import { supabase } from "./integrations/supabase/client";

// Start error monitoring before React renders
initMonitor({ supabase });

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
