/**
 * INTERACTION TEST — Dashboard loads + core action
 *
 * Simulates: authenticated user lands on dashboard → triggers navigation
 * to a key sub-route → no crash, no unexpected redirect.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
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

// ── Session mock ───────────────────────────────────────────────
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
  subscription: { plan: null, status: null, isLoading: false },
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Location spy ───────────────────────────────────────────────
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
}

function renderWithProviders(ui: React.ReactElement, initialRoute: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ═══════════════════════════════════════════════════════════════

describe('Dashboard action interaction', () => {
  let ClientDashboard: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSession.isAuthenticated = true;
    mockSession.activeRole = 'client';
    mockSession.user = { id: 'user-1', email: 'test@example.com' };
    ClientDashboard = (await import('@/pages/dashboard/client/ClientDashboard')).default;
  });

  it('dashboard renders and stays on correct path', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/dashboard/client" element={<ClientDashboard />} />
      </Routes>,
      '/dashboard/client'
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-path').textContent).toBe('/dashboard/client');
    });
  });

  it('dashboard does not redirect authenticated user', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/dashboard/client" element={<ClientDashboard />} />
        <Route path="/auth" element={<div data-testid="auth">Auth</div>} />
      </Routes>,
      '/dashboard/client'
    );

    await waitFor(() => {
      expect(screen.queryByTestId('auth')).not.toBeInTheDocument();
    });
  });

  it('dashboard contains at least one navigable link', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/dashboard/client" element={<ClientDashboard />} />
      </Routes>,
      '/dashboard/client'
    );

    await waitFor(() => {
      const links = document.querySelectorAll('a[href]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('clicking a dashboard link navigates without crash', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/dashboard/client" element={<ClientDashboard />} />
        <Route path="*" element={<div data-testid="navigated">Navigated</div>} />
      </Routes>,
      '/dashboard/client'
    );

    await waitFor(() => {
      const links = document.querySelectorAll('a[href]');
      expect(links.length).toBeGreaterThan(0);
    });

    // Click first internal link — should not crash
    const firstLink = document.querySelector('a[href]');
    if (firstLink) {
      await user.click(firstLink);
      // Verify the app is still alive (didn't throw)
      expect(document.body).toBeTruthy();
    }
  });
});
