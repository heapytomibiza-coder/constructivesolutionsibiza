/**
 * CS IBIZA - V2 APP SHELL
 * 
 * PLATFORM SCOPE: Construction & property services ONLY
 * Includes admin routes (protected by admin role).
 */

import { useEffect, useState } from "react";
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

// Public Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Services from "./pages/public/Services";
import ServiceCategory from "./pages/public/ServiceCategory";
import Professionals from "./pages/public/Professionals";
import ProfessionalDetails from "./pages/public/ProfessionalDetails";
import HowItWorks from "./pages/public/HowItWorks";
import Contact from "./pages/public/Contact";
import Privacy from "./pages/public/Privacy";
import Terms from "./pages/public/Terms";
import DisputePolicy from "./pages/public/DisputePolicy";
import About from "./pages/public/About";
import ForProfessionals from "./pages/public/ForProfessionals";
import PricingPublicPage from "./pages/public/Pricing";
import ReputationPage from "./pages/public/Reputation";
import { ServiceListingDetail } from "./pages/services";

// Auth Pages
import Auth from "./pages/auth/Auth";
import AuthCallback from "./pages/auth/AuthCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Job Wizard & Board
import PostJob from "./pages/jobs/PostJob";
import JobBoardPage from "./pages/jobs/JobBoardPage";
import JobDetailsPage from "./pages/jobs/JobDetailsPage";

// Dashboards
import ClientDashboard from "./pages/dashboard/client/ClientDashboard";
import ClientJobsList from "./pages/dashboard/client/ClientJobsList";
import JobTicketDetail from "./pages/dashboard/client/JobTicketDetail";
import MatchAndSend from "./pages/dashboard/client/MatchAndSend";
import ProDashboard from "./pages/dashboard/professional/ProDashboard";
import DashboardResolver from "./pages/dashboard/DashboardResolver";

// Messages
import Messages from "./pages/messages/Messages";

// Professional Onboarding & Management
import ProfessionalOnboarding from "./pages/onboarding/ProfessionalOnboarding";

import ProfileEdit from "./pages/professional/ProfileEdit";
import JobPriorities from "./pages/professional/JobPriorities";
import MyServiceListings from "./pages/professional/MyServiceListings";
import ServiceListingEditor from "./pages/professional/ServiceListingEditor";
import ProInsights from "./pages/professional/ProInsights";

// Settings
import { Settings } from "./pages/settings";

// Forum
import { ForumIndex, ForumCategory, ForumPost, ForumNewPost } from "./pages/forum";

// Admin
import { AdminDashboard } from "./pages/admin";
import AdminRouteLayout from "./pages/admin/AdminRouteLayout";
import {
  MetricInsightPage, MarketGapPage, FunnelsPage,
  ProPerformancePage, PricingPage, TrendRadarPage,
  UnansweredJobsPage, RepeatWorkPage, OnboardingFunnelPage, TopSourcesPage,
  MessagingPulsePage,
} from "./pages/admin/insights";
import { MonitoringPage } from "./pages/admin/monitoring";

// Launch Checklist
import LaunchChecklist from "./pages/LaunchChecklist";
import { ReportIssueWidget } from "./components/ReportIssueWidget";

const queryClient = new QueryClient();

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
            <Route path="/pricing" element={<RolloutGate min="trust-engine"><PricingPage /></RolloutGate>} />
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
              <Route path="/professional/services" element={<Navigate to="/dashboard/pro" replace />} />
              <Route path="/professional/service-setup" element={<Navigate to="/professional/listings" replace />} />
              <Route path="/professional/profile" element={<ProfileEdit />} />
              <Route path="/professional/priorities" element={<JobPriorities />} />
              <Route path="/professional/portfolio" element={<Navigate to="/dashboard/pro" replace />} />
              <Route path="/professional/listings" element={<MyServiceListings />} />
              <Route path="/professional/listings/:listingId/edit" element={<ServiceListingEditor />} />
              <Route path="/professional/insights" element={<ProInsights />} />

              {/* Forum - New Post (requires auth) */}
              <Route path="/forum/:categorySlug/new" element={<ForumNewPost />} />

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
              </Route>
            </Route>

            {/* ============================================
                CATCH-ALL - 404
                ============================================ */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ReportIssueWidget />
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
