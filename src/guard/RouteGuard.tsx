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

import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useSessionSnapshot } from '@/hooks/useSessionSnapshot';
import { getRouteConfig } from '@/app/routes';
import { checkAccess } from '@/guard/access';
import { buildRedirectUrl, buildReturnUrl } from '@/guard/redirects';
import { isRolloutActive } from '@/domain/rollout';

interface RouteGuardProps {
  children?: React.ReactNode;
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation();
  const { isAuthenticated, hasRole, isProReady, isLoading, isReady } = useSessionSnapshot();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isReady && !isLoading) return;
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [isReady, isLoading]);

  if ((isLoading || !isReady) && !timedOut) {
    return <LoadingSpinner />;
  }

  // Timed out and still unresolved — fail safe to /auth
  if ((isLoading || !isReady) && timedOut) {
    const returnUrl = buildReturnUrl(location.pathname, location.search);
    const redirectUrl = buildRedirectUrl('/auth', returnUrl);
    return <Navigate to={redirectUrl} replace />;
  }

  const currentPath = location.pathname;
  const routeConfig = getRouteConfig(currentPath);

  // If no route config found, allow access (router will handle 404)
  if (!routeConfig) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Rollout gating: block direct URL access to unreleased features
  if (routeConfig.minRollout && !isRolloutActive(routeConfig.minRollout)) {
    return <Navigate to="/" replace />;
  }

  const { access, redirectTo } = routeConfig;
  const defaultRedirect = redirectTo || '/auth';

  const hasAccess = checkAccess(access, {
    isAuthenticated,
    hasRole,
    isProReady,
  });

  if (!hasAccess) {
    const returnUrl = buildReturnUrl(location.pathname, location.search);
    const redirectUrl = buildRedirectUrl(defaultRedirect, returnUrl);
    return <Navigate to={redirectUrl} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/**
 * PublicOnlyGuard
 * - For routes like /auth that should redirect authenticated users away
 */
export function PublicOnlyGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, activeRole, isLoading, isReady } = useSessionSnapshot();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isReady && !isLoading) return;
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [isReady, isLoading]);

  // If still loading but timed out, show page anyway (let user sign in)
  if ((isLoading || !isReady) && !timedOut) {
    return <LoadingSpinner />;
  }

  // Only redirect once session is truly resolved
  if (isReady && !isLoading && isAuthenticated) {
    const dashboardPath = activeRole === 'professional' 
      ? '/dashboard/pro' 
      : '/post';  // Wizard-first for clients
    return <Navigate to={dashboardPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
