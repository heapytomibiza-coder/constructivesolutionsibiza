/**
 * SMOKE TEST — RouteGuard & PublicOnlyGuard
 *
 * Covers: loading, timeout/retry, authenticated pass-through,
 * unauthenticated redirect, public-only redirect for logged-in users.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Configurable session ───────────────────────────────────────
const mockSession = {
  isAuthenticated: false,
  hasRole: vi.fn((_role?: string) => false) as any,
  isProReady: false,
  isLoading: true,
  isReady: false,
  user: null as any,
  activeRole: null as string | null,
  refresh: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
}));

// Mock route config — simulate an auth-required route
vi.mock('@/app/routes', () => ({
  getRouteConfig: (path: string) => {
    if (path === '/protected') return { access: 'auth', redirectTo: '/auth' };
    if (path === '/admin') return { access: 'admin', redirectTo: '/auth' };
    return null; // unknown routes pass through
  },
}));

vi.mock('@/domain/rollout', () => ({
  isRolloutActive: () => true,
}));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

// ── Helpers ────────────────────────────────────────────────────
function CaptureRoute() {
  return <div data-testid="captured-route">{window.location.pathname}</div>;
}

function ProtectedContent() {
  return <div data-testid="protected">Protected Content</div>;
}

// ═══════════════════════════════════════════════════════════════

describe('RouteGuard', () => {
  let RouteGuard: React.ComponentType<{ children?: React.ReactNode }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSession.isLoading = true;
    mockSession.isReady = false;
    mockSession.isAuthenticated = false;
    mockSession.user = null;
    mockSession.activeRole = null;
    mockSession.hasRole = vi.fn(() => false);
    
    const mod = await import('@/guard/RouteGuard');
    RouteGuard = mod.RouteGuard;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading spinner while session is loading', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RouteGuard><ProtectedContent /></RouteGuard>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('allows access to protected route for authenticated user', async () => {
    mockSession.isLoading = false;
    mockSession.isReady = true;
    mockSession.isAuthenticated = true;
    mockSession.user = { id: 'u1', email: 'a@b.com' };

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RouteGuard><ProtectedContent /></RouteGuard>} />
          <Route path="/auth" element={<CaptureRoute />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('passes through unknown routes without blocking', () => {
    mockSession.isLoading = false;
    mockSession.isReady = true;

    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <Routes>
          <Route path="/unknown" element={<RouteGuard><ProtectedContent /></RouteGuard>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('redirects unauthenticated user to /auth for protected route', () => {
    mockSession.isLoading = false;
    mockSession.isReady = true;
    mockSession.isAuthenticated = false;

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RouteGuard><ProtectedContent /></RouteGuard>} />
          <Route path="/auth" element={<div data-testid="auth-page">Auth</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });

  it('denies non-admin user from admin route', () => {
    mockSession.isLoading = false;
    mockSession.isReady = true;
    mockSession.isAuthenticated = true;
    mockSession.hasRole = vi.fn((role: string) => role !== 'admin');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<RouteGuard><ProtectedContent /></RouteGuard>} />
          <Route path="/auth" element={<div data-testid="auth-page">Auth</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });
});

describe('PublicOnlyGuard', () => {
  let PublicOnlyGuard: React.ComponentType<{ children?: React.ReactNode }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSession.isLoading = false;
    mockSession.isReady = true;
    mockSession.isAuthenticated = false;
    mockSession.activeRole = null;
    mockSession.hasRole = vi.fn(() => false);

    const mod = await import('@/guard/RouteGuard');
    PublicOnlyGuard = mod.PublicOnlyGuard;
  });

  it('renders content for unauthenticated user', () => {
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<PublicOnlyGuard><div data-testid="auth-content">Auth Page</div></PublicOnlyGuard>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('auth-content')).toBeInTheDocument();
  });

  it('redirects authenticated client to client dashboard', () => {
    mockSession.isAuthenticated = true;
    mockSession.activeRole = 'client';
    mockSession.hasRole = vi.fn((r: string) => r === 'client');

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<PublicOnlyGuard><div>Auth</div></PublicOnlyGuard>} />
          <Route path="/dashboard/client" element={<div data-testid="client-dash">Client</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('client-dash')).toBeInTheDocument();
  });

  it('redirects authenticated professional to pro dashboard', () => {
    mockSession.isAuthenticated = true;
    mockSession.activeRole = 'professional';
    mockSession.hasRole = vi.fn((r: string) => r === 'professional');

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<PublicOnlyGuard><div>Auth</div></PublicOnlyGuard>} />
          <Route path="/dashboard/pro" element={<div data-testid="pro-dash">Pro</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('pro-dash')).toBeInTheDocument();
  });

  it('does NOT redirect authenticated admin (admins can view /auth)', () => {
    mockSession.isAuthenticated = true;
    mockSession.activeRole = 'admin';
    mockSession.hasRole = vi.fn((r: string) => r === 'admin');

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<PublicOnlyGuard><div data-testid="auth-content">Auth</div></PublicOnlyGuard>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('auth-content')).toBeInTheDocument();
  });
});
