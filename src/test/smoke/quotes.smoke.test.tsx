/**
 * SMOKE TEST — QuotesTab component
 * Covers: QUOTE-001 (view quotes), client/pro rendering
 * Health alert link: quote funnel → quotes UI must render correctly for both roles
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockSupabase } from '@/test/utils/mockSupabase';
import { createMockI18n } from '@/test/utils/mockI18n';
import { sessions } from '@/test/utils/mockSession';
import { makeQuote } from '@/test/utils/factories';

vi.mock('@/integrations/supabase/client', () => createMockSupabase());
vi.mock('react-i18next', () => createMockI18n());
vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));

const mockSession = sessions.client();

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockQuotesForJob = vi.fn().mockReturnValue({ data: [], isLoading: false });
const mockMyQuoteForJob = vi.fn().mockReturnValue({ data: null, isLoading: false });

vi.mock('@/pages/jobs/queries/quotes.query', () => ({
  useQuotesForJob: (...args: any[]) => mockQuotesForJob(...args),
  useMyQuoteForJob: (...args: any[]) => mockMyQuoteForJob(...args),
}));

describe('QuotesTab smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSession, sessions.client());
    mockQuotesForJob.mockReturnValue({ data: [], isLoading: false });
    mockMyQuoteForJob.mockReturnValue({ data: null, isLoading: false });
  });

  it('QUOTE-001: client owner sees quotes title', async () => {
    const { QuotesTab } = await import('@/pages/jobs/components/QuotesTab');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <QuotesTab jobId="job-1" isOwner={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/quotes\.title/)).toBeInTheDocument();
    });
  });

  it('QUOTE-001: client sees empty message when no quotes', async () => {
    const { QuotesTab } = await import('@/pages/jobs/components/QuotesTab');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <QuotesTab jobId="job-1" isOwner={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/quotes\.noQuotes/)).toBeInTheDocument();
    });
  });

  it('QUOTE-001: professional sees own quote section', async () => {
    Object.assign(mockSession, sessions.professional());

    const { QuotesTab } = await import('@/pages/jobs/components/QuotesTab');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <QuotesTab jobId="job-1" isOwner={false} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/quotes\.yourQuote/)).toBeInTheDocument();
    });
  });

  it('QUOTE-001: loading state shows spinner', async () => {
    mockQuotesForJob.mockReturnValue({ data: null, isLoading: true });

    const { QuotesTab } = await import('@/pages/jobs/components/QuotesTab');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <QuotesTab jobId="job-1" isOwner={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/quotes\.loading/)).toBeInTheDocument();
    });
  });
});
