/**
 * ROUTE REGISTRY - Route definitions only
 * 
 * THIS FILE IS THE SINGLE SOURCE OF TRUTH FOR ALL ROUTES.
 * Every route must have an explicit access rule and redirectTo.
 * Do not add route definitions elsewhere.
 */

import type { RouteConfig } from './rules';

// ============================================
// PUBLIC ROUTES - No auth required
// ============================================
export const publicRoutes: RouteConfig[] = [
  { path: '/', access: 'public' },
  { path: '/job-board', access: 'public' },
  { path: '/jobs/:id', access: 'public' },
  { path: '/professionals', access: 'public' },
  { path: '/professionals/:id', access: 'public' },
  { path: '/discovery', access: 'public' },
  { path: '/discovery/services/:slug', access: 'public' },
  { path: '/terms', access: 'public' },
  { path: '/privacy', access: 'public' },
  { path: '/cookie-policy', access: 'public' },
  { path: '/how-it-works', access: 'public' },
  { path: '/faq', access: 'public' },
  { path: '/faq/:slug', access: 'public' },
];

// ============================================
// AUTH ROUTES - Auth flow pages
// ============================================
export const authRoutes: RouteConfig[] = [
  { path: '/auth', access: 'public' },
  { path: '/auth/callback', access: 'public' },
  { path: '/auth/verify-email', access: 'public' },
  { path: '/auth/forgot-password', access: 'public' },
  { path: '/auth/reset-password', access: 'public' },
  { path: '/auth/quick-start', access: 'public' },
  { path: '/role-switcher', access: 'auth', redirectTo: '/auth' },
];

// ============================================
// CLIENT ROUTES - Client role required
// ============================================
export const clientRoutes: RouteConfig[] = [
  { path: '/dashboard/client', access: 'role:client', redirectTo: '/auth' },
  { path: '/dashboard/client/analytics', access: 'role:client', redirectTo: '/auth' },
  { path: '/post', access: 'public' }, // Auth checkpoint at publish
  { path: '/post/success', access: 'role:client', redirectTo: '/auth' },
  { path: '/templates', access: 'role:client', redirectTo: '/auth' },
];

// ============================================
// PROFESSIONAL ONBOARDING ROUTES
// ============================================
export const proOnboardingRoutes: RouteConfig[] = [
  { path: '/onboarding/professional', access: 'role:professional', redirectTo: '/auth' },
  { path: '/professional/verification', access: 'role:professional', redirectTo: '/auth' },
  { path: '/professional/service-setup', access: 'role:professional', redirectTo: '/auth' },
  { path: '/professional/services', access: 'role:professional', redirectTo: '/auth' },
  { path: '/professional/portfolio', access: 'role:professional', redirectTo: '/auth' },
];

// ============================================
// PROFESSIONAL DASHBOARD ROUTES
// ============================================
export const proDashboardRoutes: RouteConfig[] = [
  { path: '/dashboard/pro', access: 'proReady', redirectTo: '/onboarding/professional' },
  { path: '/dashboard/pro/service-requests', access: 'proReady', redirectTo: '/onboarding/professional' },
];

// ============================================
// SHARED ROUTES - Requires auth, any role
// ============================================
export const sharedRoutes: RouteConfig[] = [
  { path: '/dashboard-wrapper', access: 'auth', redirectTo: '/auth' },
  { path: '/messages', access: 'auth', redirectTo: '/auth' },
  { path: '/messages/:id', access: 'auth', redirectTo: '/auth' },
  { path: '/payments', access: 'auth', redirectTo: '/auth' },
  { path: '/disputes', access: 'auth', redirectTo: '/auth' },
  { path: '/disputes/:id', access: 'auth', redirectTo: '/auth' },
  { path: '/contracts', access: 'auth', redirectTo: '/auth' },
  { path: '/contracts/:id', access: 'auth', redirectTo: '/auth' },
  { path: '/settings', access: 'auth', redirectTo: '/auth' },
  { path: '/settings/*', access: 'auth', redirectTo: '/auth' },
];

// ============================================
// ADMIN ROUTES - Admin 2FA required
// ============================================
export const adminRoutes: RouteConfig[] = [
  { path: '/admin', access: 'admin2FA', redirectTo: '/auth' },
  { path: '/admin/users', access: 'admin2FA', redirectTo: '/auth' },
  { path: '/admin/jobs', access: 'admin2FA', redirectTo: '/auth' },
  { path: '/admin/questions', access: 'admin2FA', redirectTo: '/auth' },
  { path: '/admin/health', access: 'admin2FA', redirectTo: '/auth' },
  { path: '/admin/security', access: 'admin2FA', redirectTo: '/auth' },
];

// ============================================
// ALL ROUTES - Combined for easy lookup
// ============================================
export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...authRoutes,
  ...clientRoutes,
  ...proOnboardingRoutes,
  ...proDashboardRoutes,
  ...sharedRoutes,
  ...adminRoutes,
];
