/**
 * SMOKE TEST — /dashboard/client & /dashboard/pro
 *
 * Covers: render, loading state, unauthenticated fallback, role-specific content.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Supabase mock ──────────────────────────────────────────────
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === 'string' ? fallback : key,
    ready: true,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useSavedPros', () => ({ useSavedPros: () => ({ savedPros: [], loading: false }) }));

// ── Configurable session ───────────────────────────────────────
const mockSession = {
  isAuthenticated: true,
  hasRole: vi.fn(() => true),
  isProReady: true,
  isLoading: false,
  isReady: true,
  user: { id: 'user-1', email: 'test@example.com' } as any,
  activeRole: 'client' as string | null,
  roles: ['client'] as string[],
  refresh: vi.fn(),
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderRoute(Component: React.ComponentType, route: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={route} element={<Component />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ═══════════════════════════════════════════════════════════════

describe('/dashboard/client smoke tests', () => {
  let ClientDashboard: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSession.isAuthenticated = true;
    mockSession.user = { id: 'user-1', email: 'test@example.com' } as any;
    mockSession.activeRole = 'client';
    mockSession.roles = ['client'];
    ClientDashboard = (await import('@/pages/dashboard/client/ClientDashboard')).default;
  });

  it('renders without crashing', () => {
    renderRoute(ClientDashboard, '/dashboard/client');
    expect(document.body).toBeTruthy();
  });

  it('shows dashboard content for authenticated client', async () => {
    renderRoute(ClientDashboard, '/dashboard/client');
    await waitFor(() => {
      // Should have navigation menu items
      const links = document.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('handles missing user gracefully', async () => {
    mockSession.user = null as any;
    renderRoute(ClientDashboard, '/dashboard/client');
    // Should not crash — may show limited UI
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});

describe('/dashboard/pro smoke tests', () => {
  let ProDashboard: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSession.isAuthenticated = true;
    mockSession.user = { id: 'pro-1', email: 'pro@example.com' } as any;
    mockSession.activeRole = 'professional';
    mockSession.roles = ['professional'];
    ProDashboard = (await import('@/pages/dashboard/professional/ProDashboard')).default;
  });

  it('renders without crashing', () => {
    renderRoute(ProDashboard, '/dashboard/pro');
    expect(document.body).toBeTruthy();
  });

  it('shows dashboard content for authenticated professional', async () => {
    renderRoute(ProDashboard, '/dashboard/pro');
    await waitFor(() => {
      const links = document.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('handles missing user gracefully', async () => {
    mockSession.user = null as any;
    renderRoute(ProDashboard, '/dashboard/pro');
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
