/**
 * ROUTE GUARD - SINGLE SOURCE OF TRUTH FOR REDIRECTS
 * 
 * CRITICAL: Pages must NEVER redirect. All access control happens here.
 * Wrapped in forwardRef to silence React Router ref warnings.
 */

import { useState, useEffect, useRef, forwardRef } from 'react';
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
  const retryInFlight = useRef(false);

  const MAX_RETRIES = 3;

  // Timeout timer: triggers retry logic via state, never during render
  useEffect(() => {
    if (isReady && !isLoading) return;
    const baseDelay = Math.max(3000, 5000 - retryCount * 1000);
    const delay = isMobile ? baseDelay + 2000 : baseDelay;
    const timer = setTimeout(() => setTimedOut(true), delay);
    return () => clearTimeout(timer);
  }, [isReady, isLoading, isMobile, retryCount]);

  // Retry effect: runs when timedOut flips to true while still loading
  useEffect(() => {
    if (!timedOut || (isReady && !isLoading) || retryInFlight.current) return;

    if (retryCount < MAX_RETRIES) {
      retryInFlight.current = true;
      if (retryCount >= 1) {
        toast.error('Still connecting — retrying…', { id: 'auth-retry' });
      }
      setRetryCount(prev => prev + 1);
      setTimedOut(false);
      refresh()
        .catch((e) => console.warn('[RouteGuard] refresh failed during retry', e))
        .finally(() => { retryInFlight.current = false; });
    }
  }, [timedOut, isReady, isLoading, retryCount, refresh]);

  // Still loading, no timeout yet
  if ((isLoading || !isReady) && !timedOut) {
    return <LoadingSpinner />;
  }

  // Still loading, timed out, retries not yet exhausted → show spinner with retry
  if ((isLoading || !isReady) && timedOut && retryCount < MAX_RETRIES) {
    return <LoadingSpinner showRetry onRetry={() => { refresh().catch((e) => console.warn('[RouteGuard] manual refresh failed', e)); }} />;
  }

  // Retries exhausted, still not ready
  if ((isLoading || !isReady) && retryCount >= MAX_RETRIES) {
    const hasPersistedSession = Object.keys(localStorage).some(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (hasPersistedSession) {
      console.warn('RouteGuard: retries exhausted but session token found in storage — not redirecting');
      return (
        <LoadingSpinner
          showRetry
          onRetry={() => {
            setRetryCount(0);
            setTimedOut(false);
            refresh().catch((e) => console.warn('[RouteGuard] retry-all refresh failed', e));
          }}
        />
      );
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
