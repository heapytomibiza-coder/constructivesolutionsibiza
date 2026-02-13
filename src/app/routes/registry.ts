/**
 * V2 ROUTE REGISTRY - Simplified, locked scope
 * 
 * PLATFORM SCOPE: Construction & property services ONLY
 * Do not add lifestyle, concierge, or generic marketplace routes.
 * 
 * V2 INCLUDED: 24 route patterns total
 * V2 EXCLUDED: Admin, Payments, Escrow, Disputes, AI dashboards
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
  },
  { path: '/services/:categorySlug', access: 'public', lane: 'public' },
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
    nav: { section: 'public', labelKey: 'nav.professionals', order: 4 },
    titleKey: 'nav.professionals',
  },
  { path: '/professionals/:id', access: 'public', lane: 'public' },
  { 
    path: '/how-it-works', 
    access: 'public', 
    lane: 'public', 
    nav: { section: 'public', labelKey: 'nav.howItWorks', order: 5 },
    titleKey: 'nav.howItWorks',
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
  { 
    path: '/dashboard/client', 
    access: 'role:client', 
    redirectTo: '/auth', 
    lane: 'client', 
    nav: { section: 'hiring', labelKey: 'nav.clientDashboard', order: 2, hideWhenPublic: true },
    titleKey: 'nav.clientDashboard',
  },
  
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
    path: '/professional/service-setup', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional',
    titleKey: 'nav.proServiceSetup',
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
];

export const proDashboardRoutes: RouteConfig[] = [
  // Dashboard accessible to any professional role - the UI handles "not ready" states
  // proReady gating reserved for marketplace actions (applying to jobs, etc.)
  { 
    path: '/dashboard/pro', 
    access: 'role:professional', 
    redirectTo: '/auth', 
    lane: 'professional', 
    nav: { section: 'working', labelKey: 'nav.proDashboard', order: 1, hideWhenPublic: true },
    titleKey: 'nav.proDashboard',
  },
];

// ============================================
// ADMIN ROUTES - Platform management
// ============================================
export const adminRoutes: RouteConfig[] = [
  {
    path: '/dashboard/admin',
    access: 'admin2FA',
    redirectTo: '/auth',
    lane: 'admin',
    titleKey: 'nav.admin',
  },
];

// ============================================
// V2 EXCLUDED (do not add these yet):
// - /payments/*
// - /disputes/*
// - /contracts/*
// ============================================

// ============================================
// ALL ROUTES - Combined for lookup
// ============================================
export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...authRoutes,
  ...clientRoutes,
  ...proOnboardingRoutes,
  ...proDashboardRoutes,
  ...adminRoutes,
];
