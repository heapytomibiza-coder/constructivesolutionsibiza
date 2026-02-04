/**
 * V2 ROUTE REGISTRY - Simplified, locked scope
 * 
 * PLATFORM SCOPE: Construction & property services ONLY
 * Do not add lifestyle, concierge, or generic marketplace routes.
 * 
 * V2 INCLUDED: 15 routes total
 * V2 EXCLUDED: Admin, Payments, Escrow, Disputes, AI dashboards
 */

import type { RouteConfig } from './rules';

// ============================================
// PUBLIC ROUTES - No auth required
// ============================================
export const publicRoutes: RouteConfig[] = [
  { path: '/', access: 'public' },
  { path: '/services', access: 'public' },
  { path: '/services/:categorySlug', access: 'public' },
  { path: '/jobs', access: 'public' },
  { path: '/professionals', access: 'public' },
  { path: '/professionals/:id', access: 'public' },
  { path: '/how-it-works', access: 'public' },
  { path: '/contact', access: 'public' },
  // Forum - public read
  { path: '/forum', access: 'public' },
  { path: '/forum/:categorySlug', access: 'public' },
  { path: '/forum/post/:postId', access: 'public' },
];

// ============================================
// AUTH ROUTES - Auth flow pages
// ============================================
export const authRoutes: RouteConfig[] = [
  { path: '/auth', access: 'public' },
  { path: '/auth/callback', access: 'public' },
];

// ============================================
// CLIENT ROUTES - Client role required
// ============================================
export const clientRoutes: RouteConfig[] = [
  { path: '/post', access: 'public' }, // Auth checkpoint at publish
  { path: '/dashboard/client', access: 'role:client', redirectTo: '/auth' },
  { path: '/messages', access: 'auth', redirectTo: '/auth' },
  { path: '/messages/:id', access: 'auth', redirectTo: '/auth' },
  // Forum - new post requires auth
  { path: '/forum/:categorySlug/new', access: 'auth', redirectTo: '/auth' },
];

// ============================================
// PROFESSIONAL ROUTES
// ============================================
export const proOnboardingRoutes: RouteConfig[] = [
  { path: '/onboarding/professional', access: 'role:professional', redirectTo: '/auth' },
  { path: '/professional/services', access: 'role:professional', redirectTo: '/auth' },
  { path: '/professional/portfolio', access: 'role:professional', redirectTo: '/auth' },
  { path: '/professional/service-setup', access: 'role:professional', redirectTo: '/auth' },
];

export const proDashboardRoutes: RouteConfig[] = [
  // Dashboard accessible to any professional role - the UI handles "not ready" states
  // proReady gating reserved for marketplace actions (applying to jobs, etc.)
  { path: '/dashboard/pro', access: 'role:professional', redirectTo: '/auth' },
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
