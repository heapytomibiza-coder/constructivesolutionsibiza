/**
 * CS IBIZA — V2 APP SHELL
 *
 * Provider ownership:
 *   main.tsx  → ErrorBoundary, Suspense (crash recovery + loading)
 *   App.tsx   → QueryClient, BrowserRouter, SessionProvider, TooltipProvider (app logic)
 *
 * PLATFORM SCOPE: Construction & property services ONLY
 * Includes admin routes (protected by admin role).
 *
 * CODE SPLITTING STRATEGY:
 * - Landing page (Index), NotFound, Auth, and AuthCallback are EAGER — they are
 *   critical-path pages that must render instantly on first load or redirect.
 * - All other pages are LAZY-loaded to reduce the initial JS bundle.
 * - Guards (RouteGuard, PublicOnlyGuard, RolloutGate) remain eager since they
 *   wrap routes and must be available before lazy children resolve.
 */

import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { SessionProvider } from "@/contexts/SessionContext";
import { ScrollToTop } from "@/shared/components/layout/ScrollToTop";
import { UrlNormalizer } from "@/shared/components/layout/UrlNormalizer";
import { RouteGuard, PublicOnlyGuard, RolloutGate } from "@/guard";
import { AdminRouteChildren } from "@/app/routes/AdminRoutes";
import { preloadAlternateLanguage, preloadCoreNamespaces } from "@/i18n/preload";
import { Loader2 } from "lucide-react";
import { logJourneyEvent, touchJourneySession, JOURNEY_EVENTS } from "@/lib/journey";

/** Emits a `route_change` journey event on every navigation. Diagnostic only. */
function JourneyRouteTracker() {
  const location = useLocation();
  useEffect(() => {
    try {
      touchJourneySession(location.pathname);
      logJourneyEvent(JOURNEY_EVENTS.ROUTE_CHANGE, {
        route: location.pathname,
        payload: { hasSearch: !!location.search, hasHash: !!location.hash },
      });
    } catch {
      /* never throw */
    }
  }, [location.pathname, location.search, location.hash]);
  return null;
}

// ─── EAGER IMPORTS ──────────────────────────────────────────────
// These pages are on the critical path and must not be lazy-loaded:
// - Index: landing page, first paint
// - NotFound: catch-all, must render without network delay
// - Auth + AuthCallback: auth flow must not flash a loading spinner
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/auth/Auth";
import AuthCallback from "./pages/auth/AuthCallback";

// ─── LAZY IMPORTS ───────────────────────────────────────────────
// Public pages
const Services = lazy(() => import("./pages/public/Services"));
const ServiceCategory = lazy(() => import("./pages/public/ServiceCategory"));
const Professionals = lazy(() => import("./pages/public/Professionals"));
const ProfessionalDetails = lazy(() => import("./pages/public/ProfessionalDetails"));
const HowItWorks = lazy(() => import("./pages/public/HowItWorks"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Terms = lazy(() => import("./pages/public/Terms"));
const DisputePolicy = lazy(() => import("./pages/public/DisputePolicy"));
const About = lazy(() => import("./pages/public/About"));
const Presentation = lazy(() => import("./pages/public/Presentation"));
const ForProfessionals = lazy(() => import("./pages/public/ForProfessionals"));
const PricingPublicPage = lazy(() => import("./pages/public/Pricing"));
const ReputationPage = lazy(() => import("./pages/public/Reputation"));
const ServiceListingDetail = lazy(() => import("./pages/services/ServiceListingDetail"));

// Auth pages (non-critical path)
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Job Wizard & Board
const PostJob = lazy(() => import("./pages/jobs/PostJob"));
const JobBoardPage = lazy(() => import("./pages/jobs/JobBoardPage"));
const JobDetailsPage = lazy(() => import("./pages/jobs/JobDetailsPage"));

// Dashboards
const ClientDashboard = lazy(() => import("./pages/dashboard/client/ClientDashboard"));
const ClientJobsList = lazy(() => import("./pages/dashboard/client/ClientJobsList"));
const JobTicketDetail = lazy(() => import("./pages/dashboard/client/JobTicketDetail"));
const MatchAndSend = lazy(() => import("./pages/dashboard/client/MatchAndSend"));
const QuoteComparison = lazy(() => import("./pages/dashboard/client/QuoteComparison"));
const JobResponsesPage = lazy(() => import("./pages/jobs/responses/JobResponsesPage"));
const ProDashboard = lazy(() => import("./pages/dashboard/professional/ProDashboard"));
const ProJobsList = lazy(() => import("./pages/dashboard/professional/ProJobsList"));
const DashboardResolver = lazy(() => import("./pages/dashboard/DashboardResolver"));

// Messages
const Messages = lazy(() => import("./pages/messages/Messages"));

// Professional Onboarding & Management
const ProfessionalOnboarding = lazy(() => import("./pages/onboarding/ProfessionalOnboarding"));
const ProfileEdit = lazy(() => import("./pages/professional/ProfileEdit"));
const JobPriorities = lazy(() => import("./pages/professional/JobPriorities"));
const MyServiceListings = lazy(() => import("./pages/professional/MyServiceListings"));
const ServiceListingEditor = lazy(() => import("./pages/professional/ServiceListingEditor"));
const ManageServices = lazy(() => import("./pages/professional/ManageServices"));
const ProInsights = lazy(() => import("./pages/professional/ProInsights"));

/** Redirect legacy /professional/listings/:listingId/edit → canonical path, preserving param */
function LegacyListingEditRedirect() {
  const { listingId } = useParams<{ listingId: string }>();
  return <Navigate to={`/dashboard/pro/listings/${listingId}/edit`} replace />;
}

// Settings
const Settings = lazy(() => import("./pages/settings/Settings"));

// Forum
const ForumIndex = lazy(() => import("./pages/forum/ForumIndex"));
const ForumCategory = lazy(() => import("./pages/forum/ForumCategory"));
const ForumPost = lazy(() => import("./pages/forum/ForumPost"));
const ForumNewPost = lazy(() => import("./pages/forum/ForumNewPost"));

// Admin — extracted to AdminRoutes.tsx for bundle splitting
const AdminRouteLayout = lazy(() => import("./pages/admin/AdminRouteLayout"));

// Prototype
const PriceCalculatorPage = lazy(() => import("./pages/prototype/PriceCalculatorPage"));
const EstimateHistoryPage = lazy(() => import("./pages/prototype/EstimateHistoryPage"));
const EstimateDetailPage = lazy(() => import("./pages/prototype/EstimateDetailPage"));
const CostGuidesPage = lazy(() => import("./pages/prototype/CostGuidesPage"));

// Disputes
const RaiseDispute = lazy(() => import("./pages/disputes/RaiseDispute"));
const DisputeDetail = lazy(() => import("./pages/disputes/DisputeDetail"));
const DisputeResponse = lazy(() => import("./pages/disputes/DisputeResponse"));

// Launch Checklist
const LaunchChecklist = lazy(() => import("./pages/LaunchChecklist"));
// Defer non-essential widgets
const ReportIssueWidget = lazy(() => import('./components/ReportIssueWidget').then(m => ({ default: m.ReportIssueWidget })));

/** Silently ignore AbortErrors — these are expected during route changes / remounts. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (isAbortError(error)) return;       // swallow cancelled requests
      console.error("[QueryCache]", error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isAbortError(error)) return;
      console.error("[MutationCache]", error);
    },
  }),
});

/** Suspense fallback — minimal centered spinner matching the i18n loader */
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Redirect /marketplace/:listingId → /services/listing/:listingId */
function MarketplaceListingRedirect() {
  const { listingId } = useParams();
  return <Navigate to={`/services/listing/${listingId}`} replace />;
}

const App = () => {
  const [i18nReady, setI18nReady] = useState(false);

  // Block rendering until i18n namespaces are loaded
  useEffect(() => {
    preloadCoreNamespaces().then(() => setI18nReady(true));
    const id = window.setTimeout(preloadAlternateLanguage, 400);
    return () => window.clearTimeout(id);
  }, []);

  // Show minimal loader until translations are ready
  if (!i18nReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
           <UrlNormalizer />
           <ScrollToTop />
           <JourneyRouteTracker />
           <Suspense fallback={<PageLoader />}>
           <Routes>
            {/* ============================================
                PUBLIC ROUTES - No auth required
                ============================================ */}
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<RolloutGate min="service-layer"><Services /></RolloutGate>} />
            <Route path="/services/:categorySlug" element={<RolloutGate min="service-layer"><ServiceCategory /></RolloutGate>} />
            <Route path="/jobs" element={<JobBoardPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
            <Route path="/professionals" element={<RolloutGate min="founding-members"><Professionals /></RolloutGate>} />
            <Route path="/professionals/:id" element={<RolloutGate min="founding-members"><ProfessionalDetails /></RolloutGate>} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/dispute-policy" element={<DisputePolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/presentation" element={<Presentation />} />
            <Route path="/for-professionals" element={<RolloutGate min="trust-engine" fallbackTitle="Professional Membership Coming Soon" fallbackMessage="This page is part of the next rollout. You can still sign up and complete onboarding now." ><ForProfessionals /></RolloutGate>} />
            <Route path="/pricing" element={<RolloutGate min="trust-engine" fallbackTitle="Pricing Details Coming Soon" fallbackMessage="Pricing tiers are being finalised. Check back soon for full details." ><PricingPublicPage /></RolloutGate>} />
            <Route path="/reputation" element={<RolloutGate min="trust-engine" fallbackTitle="Reputation System Coming Soon" fallbackMessage="Our trust and reputation system is being built. It will be available in a future release." ><ReputationPage /></RolloutGate>} />
            <Route path="/services/listing/:listingId" element={<RolloutGate min="service-layer"><ServiceListingDetail /></RolloutGate>} />
            {/* Backward-compat redirects */}
            <Route path="/marketplace" element={<Navigate to="/services" replace />} />
            <Route path="/marketplace/:listingId" element={<MarketplaceListingRedirect />} />
            {/* Short-path redirects — prevent 404 on common shortcuts */}
            <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/onboarding/pro" element={<Navigate to="/onboarding/professional" replace />} />
            {/* launch-checklist moved inside admin routes below */}
            
            {/* Forum - Public read, auth for new posts */}
            <Route path="/forum" element={<ForumIndex />} />
            <Route path="/forum/:categorySlug" element={<ForumCategory />} />
            <Route path="/forum/post/:postId" element={<ForumPost />} />
            
            {/* Post Job Wizard - Public, auth checkpoint at publish */}
            <Route path="/post" element={<PostJob />} />

            {/* Prototype - Cost Guides & Price Calculator (public) */}
            <Route path="/prototype/cost-guides" element={<CostGuidesPage />} />
            <Route path="/prototype/price-calculator" element={<PriceCalculatorPage />} />

            {/* ============================================
                AUTH ROUTES - Public only (redirect if authed)
                ============================================ */}
            <Route element={<PublicOnlyGuard />}>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* ============================================
                PROTECTED ROUTES - Wrapped in RouteGuard
                ============================================ */}
            <Route element={<RouteGuard />}>
              {/* Dashboard resolver — /dashboard → correct dashboard for active role */}
              <Route path="/dashboard" element={<DashboardResolver />} />

              {/* Client Routes */}
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              <Route path="/dashboard/client/jobs" element={<ClientJobsList />} />
              <Route path="/dashboard/jobs/:jobId" element={<JobTicketDetail />} />
              <Route path="/dashboard/jobs/:jobId/invite" element={<MatchAndSend />} />
              <Route path="/dashboard/jobs/:jobId/compare" element={<QuoteComparison />} />
              <Route path="/dashboard/jobs/:jobId/responses" element={<JobResponsesPage />} />
              
              {/* Messages (shared) */}
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:id" element={<Messages />} />

              {/* Settings (shared) */}
              <Route path="/settings" element={<Settings />} />

              {/* Professional Onboarding & Setup (not dashboard sub-pages) */}
              <Route path="/onboarding/professional" element={<ProfessionalOnboarding />} />
              <Route path="/professional/services" element={<ManageServices />} />
              <Route path="/professional/service-setup" element={<Navigate to="/dashboard/pro/listings" replace />} />
              <Route path="/professional/profile" element={<ProfileEdit />} />
              <Route path="/professional/priorities" element={<JobPriorities />} />
              <Route path="/professional/portfolio" element={<Navigate to="/dashboard/pro" replace />} />

              {/* Professional Dashboard — canonical routes under /dashboard/pro/* */}
              <Route path="/dashboard/pro" element={<ProDashboard />} />
              <Route path="/dashboard/pro/jobs" element={<ProJobsList />} />
              <Route path="/dashboard/pro/job/:jobId" element={<JobTicketDetail />} />
              <Route path="/dashboard/pro/listings" element={<MyServiceListings />} />
              <Route path="/dashboard/pro/listings/:listingId/edit" element={<ServiceListingEditor />} />
              <Route path="/dashboard/pro/insights" element={<ProInsights />} />

              {/* Legacy professional redirects */}
              <Route path="/dashboard/professional/jobs" element={<Navigate to="/dashboard/pro/jobs" replace />} />
              <Route path="/dashboard/professional" element={<Navigate to="/dashboard/pro" replace />} />
              <Route path="/professional/listings/:listingId/edit" element={<LegacyListingEditRedirect />} />
              <Route path="/professional/listings" element={<Navigate to="/dashboard/pro/listings" replace />} />
              <Route path="/professional/insights" element={<Navigate to="/dashboard/pro/insights" replace />} />

              {/* Forum - New Post (requires auth) */}
              <Route path="/forum/:categorySlug/new" element={<ForumNewPost />} />

              {/* Disputes */}
              <Route path="/disputes/raise" element={<RolloutGate min="protection-beta" fallbackTitle="Issue Resolution Coming Soon" fallbackMessage="This protection flow is not live yet. For now, please contact support or message the other party from your Job Ticket." ><RaiseDispute /></RolloutGate>} />
              <Route path="/disputes/:disputeId" element={<RolloutGate min="protection-beta" fallbackTitle="Issue Resolution Coming Soon" fallbackMessage="The dispute detail view is not yet available. Please contact support for assistance." ><DisputeDetail /></RolloutGate>} />
              <Route path="/disputes/:disputeId/respond" element={<RolloutGate min="protection-beta" fallbackTitle="Issue Resolution Coming Soon" fallbackMessage="The dispute response flow is not yet available. Please contact support for assistance." ><DisputeResponse /></RolloutGate>} />

              {/* Admin Dashboard */}
              <Route path="/dashboard/admin" element={<AdminRouteLayout />}>
                {AdminRouteChildren()}
              </Route>

              {/* Estimate History (auth required) */}
              <Route path="/prototype/price-calculator/history" element={<EstimateHistoryPage />} />
              <Route path="/prototype/price-calculator/history/:id" element={<EstimateDetailPage />} />
            </Route>

            {/* ============================================
                CATCH-ALL - 404
                ============================================ */}
            <Route path="*" element={<NotFound />} />
           </Routes>
           </Suspense>
          <Suspense fallback={null}><ReportIssueWidget /></Suspense>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
