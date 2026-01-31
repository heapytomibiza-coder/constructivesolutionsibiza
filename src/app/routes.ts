/**
 * ROUTE REGISTRY - Single source of truth for all routes
 * 
 * Access Rules:
 * - public: No auth required, anyone can access
 * - auth: Requires authenticated user
 * - role:client: Requires client role
 * - role:professional: Requires professional role
 * - proReady: Professional with verified + onboarding complete + active service
 * - admin2FA: Admin role with 2FA verified
 */

export type AccessRule = 
  | 'public' 
  | 'auth' 
  | 'role:client' 
  | 'role:professional' 
  | 'proReady' 
  | 'admin2FA';

export interface RouteConfig {
  path: string;
  access: AccessRule;
  redirectTo?: string; // Where to redirect if access denied
}

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
  { path: '/faq/section', access: 'public' },
  { path: '/faq/calculator', access: 'public' },
  { path: '/faq/rental', access: 'public' },
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
  { path: '/role-switcher', access: 'auth' },
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

/**
 * Get route config by path
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  // First try exact match
  const exactMatch = allRoutes.find(r => r.path === path);
  if (exactMatch) return exactMatch;

  // Then try pattern match for dynamic routes
  for (const route of allRoutes) {
    const routePattern = route.path
      .replace(/:\w+/g, '[^/]+') // Replace :param with regex
      .replace(/\*/g, '.*'); // Replace * with wildcard
    const regex = new RegExp(`^${routePattern}$`);
    if (regex.test(path)) {
      return route;
    }
  }

  return undefined;
}

/**
 * Check if a path is public
 */
export function isPublicPath(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.access === 'public';
}
