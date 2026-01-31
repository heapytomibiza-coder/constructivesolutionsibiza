/**
 * ROUTE GUARD - SINGLE SOURCE OF TRUTH FOR REDIRECTS
 * 
 * CRITICAL: Pages must NEVER redirect. All access control happens here.
 * 
 * This component:
 * 1. Reads session snapshot once
 * 2. Returns either <Outlet /> (allow) or <Navigate /> (redirect)
 * 3. Handles all access rules from the route registry
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionSnapshot } from '@/hooks/useSessionSnapshot';
import { getRouteConfig, isPublicPath, type AccessRule } from '@/app/routes';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children?: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation();
  const {
    isAuthenticated,
    activeRole,
    hasRole,
    isProReady,
    isLoading,
    isReady,
  } = useSessionSnapshot();

  // Show loading state while session is being determined
  if (isLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const routeConfig = getRouteConfig(currentPath);

  // If no route config found, allow access (will hit 404 in router)
  if (!routeConfig) {
    return children ? <>{children}</> : <Outlet />;
  }

  const { access, redirectTo } = routeConfig;
  const defaultRedirect = redirectTo || '/auth';

  // Check access based on rule
  const hasAccess = checkAccess(access, {
    isAuthenticated,
    activeRole,
    hasRole,
    isProReady,
  });

  if (!hasAccess) {
    // Store the attempted URL for post-login redirect
    const returnUrl = currentPath + location.search;
    const redirectUrl = `${defaultRedirect}?returnUrl=${encodeURIComponent(returnUrl)}`;
    
    return <Navigate to={redirectUrl} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

interface AccessContext {
  isAuthenticated: boolean;
  activeRole: string;
  hasRole: (role: 'client' | 'professional' | 'admin') => boolean;
  isProReady: boolean;
}

function checkAccess(rule: AccessRule, ctx: AccessContext): boolean {
  switch (rule) {
    case 'public':
      return true;

    case 'auth':
      return ctx.isAuthenticated;

    case 'role:client':
      return ctx.isAuthenticated && ctx.hasRole('client');

    case 'role:professional':
      return ctx.isAuthenticated && ctx.hasRole('professional');

    case 'proReady':
      return ctx.isAuthenticated && ctx.hasRole('professional') && ctx.isProReady;

    case 'admin2FA':
      // For now, just check admin role. 2FA can be added later.
      return ctx.isAuthenticated && ctx.hasRole('admin');

    default:
      console.warn('Unknown access rule:', rule);
      return false;
  }
}

/**
 * Public Route Wrapper - for routes that should redirect authenticated users
 * (e.g., auth pages should redirect to dashboard if already logged in)
 */
export function PublicOnlyGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, activeRole, isLoading, isReady } = useSessionSnapshot();

  if (isLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to their dashboard
  if (isAuthenticated) {
    const dashboardPath = activeRole === 'professional' 
      ? '/dashboard/pro' 
      : '/dashboard/client';
    return <Navigate to={dashboardPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
