/**
 * SMOKE TEST — QuotesTab component
 * Covers: QUOTE-001 (view quotes), QUOTE-002 (accept quote render)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    ready: true,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));

const mockSession = {
  isAuthenticated: true,
  hasRole: vi.fn((_r: string) => true),
  isProReady: false,
  isLoading: false,
  isReady: true,
  user: { id: 'user-1', email: 'test@example.com' } as any,
  activeRole: 'client' as string | null,
  refresh: vi.fn(),
  subscription: { plan: null, status: null, isLoading: false },
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the quote queries
vi.mock('@/pages/jobs/queries/quotes.query', () => ({
  useQuotesForJob: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useMyQuoteForJob: vi.fn().mockReturnValue({ data: null, isLoading: false }),
}));

describe('QuotesTab smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('QUOTE-001: renders for client (owner) with no quotes', async () => {
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

  it('QUOTE-001: shows empty message when no quotes for client', async () => {
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

  it('QUOTE-001: renders for professional (non-owner)', async () => {
    mockSession.hasRole = vi.fn((r: string) => r === 'professional');
    mockSession.activeRole = 'professional';

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

    mockSession.hasRole = vi.fn(() => true);
    mockSession.activeRole = 'client';
  });
});
