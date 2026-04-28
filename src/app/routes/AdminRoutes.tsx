/**
 * Admin route subtree — lazy-loaded as a single chunk.
 *
 * All pages within are individually lazy-loaded too, so the bundler
 * can split them further. This file exists to keep App.tsx focused
 * on the top-level route tree and give the admin subtree a clear
 * code-split boundary.
 */

import { lazy } from "react";
import { Route } from "react-router-dom";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const MetricInsightPage = lazy(() => import("@/pages/admin/insights/MetricInsightPage"));
const MarketGapPage = lazy(() => import("@/pages/admin/insights/MarketGapPage"));
const FunnelsPage = lazy(() => import("@/pages/admin/insights/FunnelsPage"));
const ProPerformancePage = lazy(() => import("@/pages/admin/insights/ProPerformancePage"));
const PricingPage = lazy(() => import("@/pages/admin/insights/PricingPage"));
const TrendRadarPage = lazy(() => import("@/pages/admin/insights/TrendRadarPage"));
const UnansweredJobsPage = lazy(() => import("@/pages/admin/insights/UnansweredJobsPage"));
const RepeatWorkPage = lazy(() => import("@/pages/admin/insights/RepeatWorkPage"));
const OnboardingFunnelPage = lazy(() => import("@/pages/admin/insights/OnboardingFunnelPage"));
const TopSourcesPage = lazy(() => import("@/pages/admin/insights/TopSourcesPage"));
const MessagingPulsePage = lazy(() => import("@/pages/admin/insights/MessagingPulsePage"));
const MonitoringPage = lazy(() => import("@/pages/admin/monitoring/MonitoringPage"));
const JourneyDebugPage = lazy(() => import("@/pages/admin/monitoring/JourneyDebugPage"));
const DisputeQADashboard = lazy(() => import("@/pages/admin/qa/DisputeQADashboard"));
const AdminPricingRulesPage = lazy(() => import("@/pages/admin/pricing/AdminPricingRulesPage"));
const LaunchChecklist = lazy(() => import("@/pages/LaunchChecklist"));

export function AdminRouteChildren() {
  return (
    <>
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
      <Route path="journey-debug" element={<JourneyDebugPage />} />
      <Route path="qa/disputes" element={<DisputeQADashboard />} />
      <Route path="pricing-rules" element={<AdminPricingRulesPage />} />
      <Route path="launch-checklist" element={<LaunchChecklist />} />
    </>
  );
}
