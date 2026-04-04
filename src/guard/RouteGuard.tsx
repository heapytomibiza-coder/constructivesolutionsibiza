/**
 * ROUTE GUARD - SINGLE SOURCE OF TRUTH FOR REDIRECTS
 * 
 * CRITICAL: Pages must NEVER redirect. All access control happens here.
 * Wrapped in forwardRef to silence React Router ref warnings.
 */

import { useState, useEffect, forwardRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/contexts/SessionContext';
import { getRouteConfig } from '@/app/routes';
import { checkAccess } from '@/guard/access';
import { buildRedirectUrl, buildReturnUrl } from '@/guard/redirects';
import { isRolloutActive } from '@/domain/rollout';
import { useIsMobile } from '@/hooks/use-mobile';

interface RouteGuardProps {
  children?: React.ReactNode;
}

function LoadingSpinner({ showRetry, onRetry }: { showRetry?: boolean; onRetry?: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {showRetry ? 'Still connecting — please wait…' : 'Loading...'}
        </p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export const RouteGuard = forwardRef<HTMLDivElement, RouteGuardProps>(function RouteGuard({ children }, _ref) {
  const location = useLocation();
  const { isAuthenticated, hasRole, isProReady, isLoading, isReady, user, refresh } = useSession();
  const [retryCount, setRetryCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const isMobile = useIsMobile();

  const MAX_RETRIES = 3;

  useEffect(() => {
    if (isReady && !isLoading) return;
    // Progressive delays: 5s → 4s → 3s (mobile gets +2s each)
    const baseDelay = Math.max(3000, 5000 - retryCount * 1000);
    const delay = isMobile ? baseDelay + 2000 : baseDelay;
    const timer = setTimeout(() => setTimedOut(true), delay);
    return () => clearTimeout(timer);
  }, [isReady, isLoading, isMobile, retryCount]);

  if ((isLoading || !isReady) && !timedOut) {
    return <LoadingSpinner />;
  }

  if ((isLoading || !isReady) && timedOut) {
    // Check if there's a persisted session token before giving up.
    // This prevents force-logout when the session is just slow to hydrate
    // (e.g. slow network, multi-tab token rotation, mobile cold start).
    const hasPersistedSession = Object.keys(localStorage).some(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (retryCount < MAX_RETRIES) {
      if (retryCount >= 1) {
        toast.error('Still connecting — retrying…', { id: 'auth-retry' });
      }
      setRetryCount(prev => prev + 1);
      setTimedOut(false);
      refresh().catch(() => {});
      return <LoadingSpinner showRetry onRetry={() => { refresh().catch(() => {}); }} />;
    }

    // All retries exhausted — only redirect to auth if there's no persisted session
    if (hasPersistedSession) {
      // Session token exists but hydration failed — keep showing spinner
      // rather than force-logging the user out
      console.warn('RouteGuard: retries exhausted but session token found in storage — not redirecting');
      return <LoadingSpinner />;
    }

    const returnUrl = buildReturnUrl(location.pathname, location.search);
    const redirectUrl = buildRedirectUrl('/auth', returnUrl);
    return <Navigate to={redirectUrl} replace />;
  }

  const currentPath = location.pathname;
  const routeConfig = getRouteConfig(currentPath);

  if (!routeConfig) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (routeConfig.minRollout && !isRolloutActive(routeConfig.minRollout)) {
    return <Navigate to="/" replace />;
  }

  const { access, redirectTo } = routeConfig;
  const defaultRedirect = redirectTo || '/auth';

  const hasAccess = checkAccess(access, {
    isAuthenticated,
    hasRole,
    isProReady,
    userEmail: user?.email,
  });

  if (!hasAccess) {
    const returnUrl = buildReturnUrl(location.pathname, location.search);
    const redirectUrl = buildRedirectUrl(defaultRedirect, returnUrl);
    return <Navigate to={redirectUrl} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
});

/**
 * PublicOnlyGuard
 * - For routes like /auth that should redirect authenticated users away
 */
export const PublicOnlyGuard = forwardRef<HTMLDivElement, RouteGuardProps>(function PublicOnlyGuard({ children }, _ref) {
  const { isAuthenticated, activeRole, hasRole, isLoading, isReady } = useSession();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isReady && !isLoading) return;
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [isReady, isLoading]);

  if ((isLoading || !isReady) && !timedOut) {
    return <LoadingSpinner />;
  }

  // Admins can always view public-only pages (e.g. /auth) without redirect
  if (isReady && !isLoading && isAuthenticated && !hasRole('admin')) {
    const dashboardPath = activeRole === 'professional' 
      ? '/dashboard/pro' 
      : '/dashboard/client';
    return <Navigate to={dashboardPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
});
