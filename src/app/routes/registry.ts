/**
 * V2 ROUTE REGISTRY - Simplified, locked scope
 * 
 * PLATFORM SCOPE: Construction & property services ONLY
 * Do not add lifestyle, concierge, or generic marketplace routes.
 * 
 * V2 INCLUDED: 15 routes total
 * V2 EXCLUDED: Admin, Payments, Escrow, Disputes, AI dashboards
 * 
 * LANES: Routes are tagged with their pathway:
 * - public: Discovery pages
 * - client: Hiring lane
 * - professional: Working lane
 * - shared: Where both meet
 */

import type { RouteConfig } from './rules';

// ============================================
// PUBLIC ROUTES - No auth required
// ============================================
export const publicRoutes: RouteConfig[] = [
  { path: '/', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.home', order: 1 } },
  { path: '/services', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.services', order: 2 } },
  { path: '/services/:categorySlug', access: 'public', lane: 'public' },
  { path: '/jobs', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.jobs', order: 3 } },
  { path: '/professionals', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.professionals', order: 4 } },
  { path: '/professionals/:id', access: 'public', lane: 'public' },
  { path: '/how-it-works', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.howItWorks', order: 5 } },
  { path: '/contact', access: 'public', lane: 'public', nav: { section: 'public', labelKey: 'nav.contact', order: 6 } },
  // Forum - public read, appears in shared section
  { path: '/forum', access: 'public', lane: 'public', nav: { section: 'shared', labelKey: 'nav.community', order: 50 } },
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
  { path: '/post', access: 'public', lane: 'client', nav: { section: 'hiring', labelKey: 'nav.postJob', order: 1 } },
  { path: '/dashboard/client', access: 'role:client', redirectTo: '/auth', lane: 'client', nav: { section: 'hiring', labelKey: 'nav.dashboard', order: 2 } },
  
  // Shared hub routes
  { path: '/messages', access: 'auth', redirectTo: '/auth', lane: 'shared', nav: { section: 'shared', labelKey: 'nav.messages', order: 1 } },
  { path: '/messages/:id', access: 'auth', redirectTo: '/auth', lane: 'shared' },
  { path: '/settings', access: 'auth', redirectTo: '/auth', lane: 'shared', nav: { section: 'account', labelKey: 'nav.settings', order: 99 } },
  
  // Forum write is shared hub
  { path: '/forum/:categorySlug/new', access: 'auth', redirectTo: '/auth', lane: 'shared' },
];

// ============================================
// PROFESSIONAL ROUTES - Working lane
// ============================================
export const proOnboardingRoutes: RouteConfig[] = [
  { path: '/onboarding/professional', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
  { path: '/professional/services', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
  { path: '/professional/portfolio', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
  { path: '/professional/service-setup', access: 'role:professional', redirectTo: '/auth', lane: 'professional' },
];

export const proDashboardRoutes: RouteConfig[] = [
  // Dashboard accessible to any professional role - the UI handles "not ready" states
  // proReady gating reserved for marketplace actions (applying to jobs, etc.)
  { path: '/dashboard/pro', access: 'role:professional', redirectTo: '/auth', lane: 'professional', nav: { section: 'working', labelKey: 'nav.dashboard', order: 1 } },
];

// ============================================
// V2 EXCLUDED (do not add these yet):
// - /admin/*
// - /payments/*
// - /disputes/*
// - /contracts/*
// - /analytics/*
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
];
