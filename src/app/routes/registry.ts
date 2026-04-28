/**
 * V2 ROUTE REGISTRY - Simplified, locked scope
 * 
 * PLATFORM SCOPE: Construction & property services ONLY
 * Do not add lifestyle, concierge, or generic marketplace routes.
 * 
 * V2 INCLUDED: 24 route patterns total
 * V2 EXCLUDED: Admin, Payments, Disputes, AI dashboards
 * 
 * LANES: Routes are tagged with their pathway:
 * - public: Discovery pages
 * - client: Hiring lane
 * - professional: Working lane
 * - shared: Where both meet
 * 
 * CONVENTIONS:
 * - Every route MUST have a lane
 * - Any route in nav MUST have nav.labelKey in common.json
 * - No manual nav arrays elsewhere - derive from registry
 */

import type { RouteConfig } from './rules';

// ============================================
// PUBLIC ROUTES - No auth required
// ============================================
export const publicRoutes: RouteConfig[] = [
  { 
    path: '/', 
    access: 'public', 
    lane: 'public', 
    nav: { section: 'public', labelKey: 'nav.home', order: 1 },
    titleKey: 'nav.home',
  },
  { 
    path: '/services', 
    access: 'public', 
    lane: 'public', 
    nav: { section: 'public', labelKey: 'nav.services', order: 2 },
    titleKey: 'nav.services',
    minRollout: 'service-layer',
  },
  { path: '/services/:categorySlug', access: 'public', lane: 'public', minRollout: 'service-layer' },
  { 
    path: '/jobs', 
    access: 'public', 
    lane: 'public', 
    nav: { section: 'public', labelKey: 'nav.jobs', order: 3 },
    titleKey: 'nav.jobs',
  },
  { 
    path: '/professionals', 
    access: 'public', 
    lane: 'public', 
    titleKey: 'nav.professionals',
    minRollout: 'founding-members',
  },
  { path: '/professionals/:id', access: 'public', lane: 'public', minRollout: 'founding-members' },
  { path: '/services/listing/:listingId', access: 'public', lane: 'public', minRollout: 'service-layer' },
  { 
    path: '/how-it-works', 
    access: 'public', 
    lane: 'public', 
    nav: { section: 'public', labelKey: 'nav.howItWorks', order: 5 },
    titleKey: 'nav.howItWorks',
  },
  { 
    path: '/about', 
    access: 'public', 
    lane: 'public', 
    titleKey: 'nav.about',
  },
  { 
    path: '/contact', 
    access: 'public', 
    lane: 'public', 
    titleKey: 'nav.contact',
  },
  // Forum - public read, appears in shared section for authenticated users
  { 
    path: '/forum', 
    access: 'public', 
    lane: 'public', 
    nav: { section: 'shared', labelKey: 'nav.community', order: 50 },
    titleKey: 'nav.community',
  },
  { path: '/forum/:categorySlug', access: 'public', lane: 'public' },
  { path: '/forum/post/:postId', access: 'public', lane: 'public' },
  { path: '/dispute-policy', access: 'public', lane: 'public' },
  { 
    path: '/for-professionals', 
    access: 'public', 
    lane: 'public', 
    titleKey: 'nav.forProfessionals',
    minRollout: 'trust-engine',
  },
  { 
    path: '/pricing', 
    access: 'public', 
    lane: 'public', 
    titleKey: 'nav.pricing',
    minRollout: 'trust-engine',
  },
  { 
    path: '/reputation', 
    access: 'public', 
    lane: 'public', 
    titleKey: 'nav.reputation',
    minRollout: 'trust-engine',
  },
];

// ============================================
// AUTH ROUTES - Auth flow pages
// ============================================
export const authRoutes: RouteConfig[] = [
  { path: '/auth', access: 'public', lane: 'auth' },
  { path: '/auth/callback', access: 'public', lane: 'auth' },
];

// ============================================
// CLIENT ROUTES - Hiring lane
// ============================================
export const clientRoutes: RouteConfig[] = [
  // Post job is the start of hiring lane (auth checkpoint at publish)
  { 
    path: '/post', 
    access: 'public', 
    lane: 'client', 
    nav: { section: 'hiring', labelKey: 'nav.postJob', order: 1 },
    titleKey: 'nav.postJob',
  },
  { path: '/dashboard', access: 'auth', redirectTo: '/auth', lane: 'shared' },
  { 
    path: '/dashboard/client', 
    access: 'role:client', 
    redirectTo: '/auth', 
    lane: 'client', 
    nav: { section: 'hiring', labelKey: 'nav.clientDashboard', order: 2, hideWhenPublic: true },
    titleKey: 'nav.clientDashboard',
  },
  {
    path: '/dashboard/client/jobs',
    access: 'role:client',
    redirectTo: '/auth',
    lane: 'client',
    titleKey: 'nav.clientJobs',
  },
  // Shared job ticket routes (accessible by both client and pro via role check in component)
  { path: '/dashboard/jobs/:jobId', access: 'auth', redirectTo: '/auth', lane: 'shared' },
  { path: '/dashboard/jobs/:jobId/invite', access: 'auth', redirectTo: '/auth', lane: 'shared' },
  { path: '/dashboard/jobs/:jobId/compare', access: 'auth', redirectTo: '/auth', lane: 'shared' },
  { path: '/dashboard/jobs/:jobId/responses', access: 'role:client', redirectTo: '/auth', lane: 'client' },
  
  // Shared hub routes
  { 
    path: '/messages', 
    access: 'auth', 
    redirectTo: '/auth', 
    lane: 'shared', 
    titleKey: 'nav.messages',
  },
  { path: '/messages/:id', access: 'auth', redirectTo: '/auth', lane: 'shared' },
  { 
    path: '/settings', 
    access: 'auth', 
    redirectTo: '/auth', 
    lane: 'shared', 
    nav: { section: 'account', labelKey: 'nav.settings', order: 99, hideWhenPublic: true },
    titleKey: 'nav.settings',
  },
  
  // Forum write is shared hub
  { path: '/forum/:categorySlug/new', access: 'auth', redirectTo: '/auth', lane: 'shared' },
];

// ============================================
// PROFESSIONAL ROUTES - Working lane
// ============================================
export const proOnboardingRoutes: RouteConfig[] = [
  { 
    path: '/onboarding/professional', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional',
    titleKey: 'nav.proOnboarding',
  },
  { 
    path: '/professional/services', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional',
    titleKey: 'nav.proServices',
  },
  { 
    path: '/professional/portfolio', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional',
    titleKey: 'nav.proPortfolio',
  },
  { 
    path: '/professional/priorities', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional',
    nav: { section: 'working', labelKey: 'nav.jobPriorities', order: 3, hideWhenPublic: true },
    titleKey: 'nav.jobPriorities',
  },
  { 
    path: '/professional/profile', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional',
    titleKey: 'nav.proProfile',
  },
  // Legacy: /professional/listings and /professional/insights now redirect to /dashboard/pro/*
  // Kept in registry for RouteGuard awareness only
  { path: '/professional/listings', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
  { path: '/professional/listings/:listingId/edit', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
  { path: '/professional/insights', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
];

export const proDashboardRoutes: RouteConfig[] = [
  { 
    path: '/dashboard/pro', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional', 
    nav: { section: 'working', labelKey: 'nav.proDashboard', order: 1, hideWhenPublic: true },
    titleKey: 'nav.proDashboard',
  },
  {
    path: '/dashboard/pro/jobs',
    access: 'role:professional',
    redirectTo: '/auth',
    lane: 'professional',
    titleKey: 'nav.proJobs',
  },
  { path: '/dashboard/pro/job/:jobId', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
  {
    path: '/dashboard/pro/listings',
    access: 'role:professional',
    redirectTo: '/auth',
    lane: 'professional',
    nav: { section: 'working', labelKey: 'nav.myListings', order: 2, hideWhenPublic: true },
    titleKey: 'nav.myListings',
  },
  { path: '/dashboard/pro/listings/:listingId/edit', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
  {
    path: '/dashboard/pro/insights',
    access: 'role:professional',
    redirectTo: '/auth',
    lane: 'professional',
    titleKey: 'nav.proInsights',
  },
];

// ============================================
// ADMIN ROUTES - Platform management
// ============================================
export const adminRoutes: RouteConfig[] = [
  {
    path: '/dashboard/admin',
    access: 'admin',
    redirectTo: '/auth',
    lane: 'admin',
    titleKey: 'nav.admin',
  },
  { path: '/dashboard/admin/insights/:metricKey', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/market-gap', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/funnels', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/pro-performance', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/pricing', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/trends', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/unanswered-jobs', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/repeat-work', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/onboarding-funnel', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/top-sources', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/insights/messaging-pulse', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/monitoring', access: 'admin', redirectTo: '/auth', lane: 'admin' },
  { path: '/dashboard/admin/pricing-rules', access: 'admin', redirectTo: '/auth', lane: 'admin' },
];

// ============================================
// DISPUTE ROUTES - Resolution engine
// ============================================
export const disputeRoutes: RouteConfig[] = [
  {
    path: '/disputes/raise',
    access: 'auth',
    redirectTo: '/auth',
    lane: 'shared',
    titleKey: 'nav.raiseDispute',
    minRollout: 'protection-beta',
  },
  {
    path: '/disputes/:disputeId',
    access: 'auth',
    redirectTo: '/auth',
    lane: 'shared',
    minRollout: 'protection-beta',
  },
  {
    path: '/disputes/:disputeId/respond',
    access: 'auth',
    redirectTo: '/auth',
    lane: 'shared',
    minRollout: 'protection-beta',
  },
];

// ============================================
// V2 EXCLUDED (do not add these yet):
// - /payments/*
// - /contracts/*
// ============================================

// ============================================
// PROTOTYPE ROUTES - Isolated, not in nav
// ============================================
export const prototypeRoutes: RouteConfig[] = [
  { path: '/prototype/cost-guides', access: 'public', lane: 'public' },
  { path: '/prototype/price-calculator', access: 'public', lane: 'public' },
  { path: '/prototype/price-calculator/history', access: 'auth', redirectTo: '/auth', lane: 'shared' },
  { path: '/prototype/price-calculator/history/:id', access: 'auth', redirectTo: '/auth', lane: 'shared' },
];

// ============================================
// ALL ROUTES - Combined for lookup
// ============================================
export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...authRoutes,
  ...clientRoutes,
  ...proOnboardingRoutes,
  ...proDashboardRoutes,
  ...disputeRoutes,
  ...adminRoutes,
  ...prototypeRoutes,
];
