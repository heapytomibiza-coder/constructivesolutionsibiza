/**
 * INTERACTION TEST — Auth redirect journey
 *
 * Simulates: unauthenticated user hits protected route → redirected to /auth
 * with returnUrl preserved → after login, redirect target is correct.
 *
 * Tests the guard + redirect helpers as a connected unit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import { checkAccess, type AccessContext } from '@/guard/access';
import { buildRedirectUrl, buildReturnUrl, isSafeReturnUrl } from '@/guard/redirects';

// ── Session mock ───────────────────────────────────────────────
const mockSession = {
  isAuthenticated: false,
  hasRole: vi.fn(() => false) as any,
  isProReady: false,
  isLoading: false,
  isReady: true,
  user: null as any,
  activeRole: null as string | null,
  refresh: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
}));

vi.mock('@/app/routes', () => ({
  getRouteConfig: (path: string) => {
    if (path.startsWith('/dashboard')) return { access: 'auth', redirectTo: '/auth' };
    if (path.startsWith('/post')) return { access: 'auth', redirectTo: '/auth' };
    return null;
  },
}));

vi.mock('@/domain/rollout', () => ({ isRolloutActive: () => true }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

// ── Helper: capture the URL we landed on ───────────────────────
function AuthLanding() {
  const [params] = useSearchParams();
  return (
    <div>
      <span data-testid="auth-page">Auth</span>
      <span data-testid="return-url">{params.get('returnUrl') ?? ''}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════

describe('Auth redirect journey', () => {
  let RouteGuard: React.ComponentType<{ children?: React.ReactNode }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSession.isAuthenticated = false;
    mockSession.isLoading = false;
    mockSession.isReady = true;
    mockSession.user = null;
    RouteGuard = (await import('@/guard/RouteGuard')).RouteGuard;
  });

  it('unauthenticated user on /dashboard/client is redirected to /auth', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/client']}>
        <Routes>
          <Route path="/dashboard/client" element={<RouteGuard><div>Dashboard</div></RouteGuard>} />
          <Route path="/auth" element={<AuthLanding />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });

  it('returnUrl is preserved as /dashboard/client', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/client']}>
        <Routes>
          <Route path="/dashboard/client" element={<RouteGuard><div>Dashboard</div></RouteGuard>} />
          <Route path="/auth" element={<AuthLanding />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('return-url').textContent).toBe('/dashboard/client');
  });

  it('returnUrl preserves query string from original route', () => {
    render(
      <MemoryRouter initialEntries={['/post?category=plumbing']}>
        <Routes>
          <Route path="/post" element={<RouteGuard><div>Post</div></RouteGuard>} />
          <Route path="/auth" element={<AuthLanding />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('return-url').textContent).toBe('/post?category=plumbing');
  });

  it('buildRedirectUrl only appends returnUrl for /auth targets', () => {
    const authRedirect = buildRedirectUrl('/auth', '/dashboard/pro');
    expect(authRedirect).toContain('returnUrl=');

    const nonAuthRedirect = buildRedirectUrl('/onboarding', '/dashboard/pro');
    expect(nonAuthRedirect).toBe('/onboarding');
    expect(nonAuthRedirect).not.toContain('returnUrl');
  });

  it('after authentication, access check passes for the same route', () => {
    const unauthCtx: AccessContext = {
      isAuthenticated: false,
      hasRole: () => false,
      isProReady: false,
    };
    expect(checkAccess('auth', unauthCtx)).toBe(false);

    const authCtx: AccessContext = {
      isAuthenticated: true,
      hasRole: () => true,
      isProReady: true,
    };
    expect(checkAccess('auth', authCtx)).toBe(true);
  });

  it('buildReturnUrl concatenates pathname and search', () => {
    expect(buildReturnUrl('/jobs', '?status=open')).toBe('/jobs?status=open');
    expect(buildReturnUrl('/post', '')).toBe('/post');
  });
});

describe('isSafeReturnUrl', () => {
  it('accepts internal app paths', () => {
    expect(isSafeReturnUrl('/dashboard/jobs')).toBe(true);
    expect(isSafeReturnUrl('/post?category=plumbing')).toBe(true);
    expect(isSafeReturnUrl('/dashboard/pro#section')).toBe(true);
    expect(isSafeReturnUrl('/')).toBe(true);
  });

  it('rejects external absolute URLs', () => {
    expect(isSafeReturnUrl('https://evil.com')).toBe(false);
    expect(isSafeReturnUrl('http://evil.com/path')).toBe(false);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isSafeReturnUrl('//evil.com')).toBe(false);
    expect(isSafeReturnUrl('//evil.com/dashboard')).toBe(false);
  });

  it('rejects backslash-prefixed paths', () => {
    expect(isSafeReturnUrl('/\\evil.com')).toBe(false);
    expect(isSafeReturnUrl('/\\\\evil.com')).toBe(false);
  });

  it('rejects javascript: and other protocol schemes', () => {
    expect(isSafeReturnUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeReturnUrl('/javascript:alert(1)')).toBe(false);
    expect(isSafeReturnUrl('data:text/html,foo')).toBe(false);
    expect(isSafeReturnUrl('/path:with:colon')).toBe(false);
  });

  it('rejects empty, non-string, and whitespace-only values', () => {
    expect(isSafeReturnUrl('')).toBe(false);
    expect(isSafeReturnUrl('   ')).toBe(false);
    expect(isSafeReturnUrl(null)).toBe(false);
    expect(isSafeReturnUrl(undefined)).toBe(false);
    expect(isSafeReturnUrl(42)).toBe(false);
  });

  it('rejects relative paths without leading slash', () => {
    expect(isSafeReturnUrl('dashboard/jobs')).toBe(false);
    expect(isSafeReturnUrl('evil.com')).toBe(false);
  });

  it('rejects values with embedded control characters', () => {
    expect(isSafeReturnUrl('/dashboard\nLocation: evil')).toBe(false);
    expect(isSafeReturnUrl('/dashboard\t')).toBe(false);
  });
});

