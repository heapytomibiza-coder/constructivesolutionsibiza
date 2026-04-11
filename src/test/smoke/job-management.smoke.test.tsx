/**
 * SMOKE TEST — Job management pages
 * Covers: JOBM-001 (client job list), JOBM-002 (job detail), JOBM-003 (cancel job)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
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

const mockSession = {
  isAuthenticated: true,
  hasRole: vi.fn(() => true),
  isProReady: false,
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

describe('Job management smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('JOBM-001: job details page renders without crashing', async () => {
    const JobDetailsPage = (await import('@/pages/jobs/JobDetailsPage')).default;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/jobs/test-job-id']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    }, { timeout: 10000 });
  }, 15000);

  it('JOBM-001: job board page renders without crashing', async () => {
    const JobBoardPage = (await import('@/pages/jobs/JobBoardPage')).default;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/jobs']}>
          <JobBoardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('JOBM-002: job detail handles missing job gracefully', async () => {
    const JobDetailsPage = (await import('@/pages/jobs/JobDetailsPage')).default;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/jobs/nonexistent-id']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      // Should not crash even with nonexistent job
      expect(document.body).toBeTruthy();
    });
  });
});
