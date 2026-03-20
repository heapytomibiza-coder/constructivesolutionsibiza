/**
 * CS IBIZA - V2 APP SHELL
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { SessionProvider } from "@/contexts/SessionContext";
import { ScrollToTop } from "@/shared/components/layout/ScrollToTop";
import { UrlNormalizer } from "@/shared/components/layout/UrlNormalizer";
import { RouteGuard, PublicOnlyGuard, RolloutGate } from "@/guard";
import { preloadAlternateLanguage, preloadCoreNamespaces } from "@/i18n/preload";
import { Loader2 } from "lucide-react";

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
const ProDashboard = lazy(() => import("./pages/dashboard/professional/ProDashboard"));
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

// Settings
const Settings = lazy(() => import("./pages/settings/Settings"));

// Forum
const ForumIndex = lazy(() => import("./pages/forum/ForumIndex"));
const ForumCategory = lazy(() => import("./pages/forum/ForumCategory"));
const ForumPost = lazy(() => import("./pages/forum/ForumPost"));
const ForumNewPost = lazy(() => import("./pages/forum/ForumNewPost"));

// Admin — import pages directly to avoid pulling the entire admin barrel (hooks, actions, types)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminRouteLayout = lazy(() => import("./pages/admin/AdminRouteLayout"));
const MetricInsightPage = lazy(() => import("./pages/admin/insights/MetricInsightPage"));
const MarketGapPage = lazy(() => import("./pages/admin/insights/MarketGapPage"));
const FunnelsPage = lazy(() => import("./pages/admin/insights/FunnelsPage"));
const ProPerformancePage = lazy(() => import("./pages/admin/insights/ProPerformancePage"));
const PricingPage = lazy(() => import("./pages/admin/insights/PricingPage"));
const TrendRadarPage = lazy(() => import("./pages/admin/insights/TrendRadarPage"));
const UnansweredJobsPage = lazy(() => import("./pages/admin/insights/UnansweredJobsPage"));
const RepeatWorkPage = lazy(() => import("./pages/admin/insights/RepeatWorkPage"));
const OnboardingFunnelPage = lazy(() => import("./pages/admin/insights/OnboardingFunnelPage"));
const TopSourcesPage = lazy(() => import("./pages/admin/insights/TopSourcesPage"));
const MessagingPulsePage = lazy(() => import("./pages/admin/insights/MessagingPulsePage"));
const MonitoringPage = lazy(() => import("./pages/admin/monitoring/MonitoringPage"));
const DisputeQADashboard = lazy(() => import("./pages/admin/qa/DisputeQADashboard"));

// Disputes
const RaiseDispute = lazy(() => import("./pages/disputes/RaiseDispute"));
const DisputeDetail = lazy(() => import("./pages/disputes/DisputeDetail"));
const DisputeResponse = lazy(() => import("./pages/disputes/DisputeResponse"));

// Launch Checklist
const LaunchChecklist = lazy(() => import("./pages/LaunchChecklist"));
import { ReportIssueWidget } from "./components/ReportIssueWidget";

const queryClient = new QueryClient();

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
            <Route path="/for-professionals" element={<RolloutGate min="trust-engine"><ForProfessionals /></RolloutGate>} />
            <Route path="/pricing" element={<RolloutGate min="trust-engine"><PricingPublicPage /></RolloutGate>} />
            <Route path="/reputation" element={<RolloutGate min="trust-engine"><ReputationPage /></RolloutGate>} />
            <Route path="/services/listing/:listingId" element={<RolloutGate min="service-layer"><ServiceListingDetail /></RolloutGate>} />
            {/* Backward-compat redirects */}
            <Route path="/marketplace" element={<Navigate to="/services" replace />} />
            <Route path="/marketplace/:listingId" element={<MarketplaceListingRedirect />} />
            <Route path="/launch-checklist" element={<LaunchChecklist />} />
            
            {/* Forum - Public read, auth for new posts */}
            <Route path="/forum" element={<ForumIndex />} />
            <Route path="/forum/:categorySlug" element={<ForumCategory />} />
            <Route path="/forum/post/:postId" element={<ForumPost />} />
            
            {/* Post Job Wizard - Public, auth checkpoint at publish */}
            <Route path="/post" element={<PostJob />} />

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
              
              {/* Messages (shared) */}
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:id" element={<Messages />} />

              {/* Settings (shared) */}
              <Route path="/settings" element={<Settings />} />

              {/* Professional Onboarding */}
              <Route path="/onboarding/professional" element={<ProfessionalOnboarding />} />
              <Route path="/professional/services" element={<ManageServices />} />
              <Route path="/professional/service-setup" element={<Navigate to="/professional/listings" replace />} />
              <Route path="/professional/profile" element={<ProfileEdit />} />
              <Route path="/professional/priorities" element={<JobPriorities />} />
              <Route path="/professional/portfolio" element={<Navigate to="/dashboard/pro" replace />} />
              <Route path="/professional/listings" element={<MyServiceListings />} />
              <Route path="/professional/listings/:listingId/edit" element={<ServiceListingEditor />} />
              <Route path="/professional/insights" element={<ProInsights />} />

              {/* Forum - New Post (requires auth) */}
              <Route path="/forum/:categorySlug/new" element={<ForumNewPost />} />

              {/* Disputes */}
              <Route path="/disputes/raise" element={<RolloutGate min="service-layer"><RaiseDispute /></RolloutGate>} />
              <Route path="/disputes/:disputeId" element={<RolloutGate min="service-layer"><DisputeDetail /></RolloutGate>} />
              <Route path="/disputes/:disputeId/respond" element={<RolloutGate min="service-layer"><DisputeResponse /></RolloutGate>} />

              {/* Professional Dashboard */}
              <Route path="/dashboard/pro" element={<ProDashboard />} />

              {/* Admin Dashboard */}
              <Route path="/dashboard/admin" element={<AdminRouteLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="insights/market-gap" element={<MarketGapPage />} />
                <Route path="insights/funnels" element={<FunnelsPage />} />
                <Route path="insights/pro-performance" element={<ProPerformancePage />} />
                <Route path="insights/pricing" element={<PricingPage />} />
                <Route path="insights/trends" element={<TrendRadarPage />} />
                <Route path="insights/unanswered-jobs" element={<UnansweredJobsPage />} />
                <Route path="insights/repeat-work" element={<RepeatWorkPage />} />
                <Route path="insights/onboarding-funnel" element={<OnboardingFunnelPage />} />
                <Route path="insights/top-sources" element={<TopSourcesPage />} />
                <Route path="insights/messaging-pulse" element={<MessagingPulsePage />} />
                <Route path="insights/:metricKey" element={<MetricInsightPage />} />
                <Route path="monitoring" element={<MonitoringPage />} />
                <Route path="qa/disputes" element={<DisputeQADashboard />} />
              </Route>
            </Route>

            {/* ============================================
                CATCH-ALL - 404
                ============================================ */}
            <Route path="*" element={<NotFound />} />
           </Routes>
           </Suspense>
          <ReportIssueWidget />
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
