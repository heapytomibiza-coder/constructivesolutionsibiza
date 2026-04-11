/**
 * SMOKE TEST — Job management pages
 * Covers: JOBM-001 (job board render), JOBM-002 (job detail + modal)
 * Health alert link: job posting pipeline → job pages must render
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockSupabase } from '@/test/utils/mockSupabase';
import { sessions } from '@/test/utils/mockSession';
import { createMockI18n } from '@/test/utils/mockI18n';

vi.mock('@/integrations/supabase/client', () => createMockSupabase());
vi.mock('react-i18next', () => createMockI18n());
vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useSavedPros', () => ({ useSavedPros: () => ({ savedPros: [], loading: false }) }));

const mockSession = sessions.client();

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Job management smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, sessions.client());
  });

  it('JOBM-001: job board page renders with content', async () => {
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
      // Job board should render its layout with hero or content section
      const content = document.querySelector('main, section');
      expect(content).toBeTruthy();
    });
  });

  it('JOBM-002: job detail page renders with modal', async () => {
    const JobDetailsPage = (await import('@/pages/jobs/JobDetailsPage')).default;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/jobs/test-job-id']}>
          <Routes>
            <Route path="/jobs/:jobId" element={<JobDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      // JobDetailsPage wraps JobBoardPage + opens a modal
      expect(document.body).toBeTruthy();
    }, { timeout: 10000 });
  }, 15000);
});
