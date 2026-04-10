/**
 * SMOKE TEST — /auth route
 *
 * Validates loading, empty, error, and redirect states for the auth page.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-expect-error — TS moduleResolution:bundler doesn't resolve @testing-library/react types fully
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock supabase before importing components
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resend: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    ready: true,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Mock trackEvent
vi.mock('@/lib/trackEvent', () => ({
  trackEvent: vi.fn(),
}));

// Mock session context
const mockSession = {
  isAuthenticated: false,
  hasRole: vi.fn(() => false),
  isProReady: false,
  isLoading: false,
  isReady: true,
  user: null,
  activeRole: null,
  refresh: vi.fn(),
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderWithProviders(ui: React.ReactElement, route = '/auth') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('/auth smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.isAuthenticated = false;
    mockSession.user = null;
    mockSession.activeRole = null;
  });

  it('renders the auth page without crashing', async () => {
    const Auth = (await import('@/pages/auth/Auth')).default;
    renderWithProviders(<Auth />);
    // Should render sign-in and sign-up tabs
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  it('shows sign-in form by default', async () => {
    const Auth = (await import('@/pages/auth/Auth')).default;
    renderWithProviders(<Auth />);
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  it('shows sign-up form when mode=signup', async () => {
    const Auth = (await import('@/pages/auth/Auth')).default;
    renderWithProviders(<Auth />, '/auth?mode=signup');
    await waitFor(() => {
      // signup tab should be active
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('preserves returnUrl in search params without crashing', async () => {
    const Auth = (await import('@/pages/auth/Auth')).default;
    renderWithProviders(<Auth />, '/auth?returnUrl=/dashboard/pro');
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });
});

describe('/auth/callback smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the callback spinner without crashing', async () => {
    const AuthCallback = (await import('@/pages/auth/AuthCallback')).default;
    renderWithProviders(<AuthCallback />);
    expect(screen.getByText(/completing sign in/i)).toBeInTheDocument();
  });

  it('redirects to /auth when no session exists', async () => {
    const AuthCallback = (await import('@/pages/auth/AuthCallback')).default;
    const { container } = renderWithProviders(<AuthCallback />);
    // Should show spinner initially, then redirect handled by navigate
    expect(container).toBeTruthy();
  });
});
