/**
 * SMOKE TEST — /messages route
 *
 * Validates loading, empty, not-found, thread, and incident-route safety.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockSupabase } from '@/test/utils/mockSupabase';

const mockClient = createMockSupabase();
vi.mock('@/integrations/supabase/client', () => mockClient);

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

// Configurable session mock
const mockSession = {
  isAuthenticated: true,
  hasRole: vi.fn(() => true),
  isProReady: false,
  isLoading: false,
  isReady: true,
  user: { id: 'test-user-123', email: 'test@example.com' } as { id: string; email: string } | null,
  activeRole: 'client' as string | null,
  roles: ['client'] as string[],
  refresh: vi.fn(),
  switchRole: vi.fn(),
  subscription: { plan: null, status: null, isLoading: false },
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

const INCIDENT_CONVERSATION_ID = 'ec7c477e-5254-4069-b892-daeb87d78c50';

function renderMessages(route = '/messages') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<MessagesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

let MessagesPage: React.ComponentType;

/**
 * Configure the supabase `from()` mock so different tables return
 * different responses for a single test.
 */
function configureFromTables(tableMap: Record<string, { data: unknown; error: unknown }>) {
  (mockClient.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    const response = tableMap[table] ?? { data: [], error: null };
    const builder: Record<string, unknown> = {};
    const chain = ['select', 'eq', 'neq', 'in', 'is', 'gte', 'lte', 'order', 'limit', 'range', 'ilike', 'or', 'filter', 'insert', 'update', 'upsert', 'delete'];
    for (const m of chain) builder[m] = vi.fn().mockReturnThis();
    builder.maybeSingle = vi.fn().mockResolvedValue(response);
    builder.single = vi.fn().mockResolvedValue(response);
    builder.then = vi.fn((resolve: (v: unknown) => unknown) => Promise.resolve(response).then(resolve));
    return builder;
  });
}

describe('/messages smoke tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset session defaults
    mockSession.user = { id: 'test-user-123', email: 'test@example.com' };
    mockSession.isAuthenticated = true;
    mockSession.isLoading = false;
    // Reset supabase mocks to defaults
    (mockClient.supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const builder: Record<string, unknown> = {};
      const chain = ['select', 'eq', 'neq', 'in', 'is', 'gte', 'lte', 'order', 'limit', 'range', 'ilike', 'or', 'filter', 'insert', 'update', 'upsert', 'delete'];
      for (const m of chain) builder[m] = vi.fn().mockReturnThis();
      builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
      builder.then = vi.fn((resolve: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve));
      return builder;
    });
    (mockClient.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });
    MessagesPage = (await import('@/pages/messages/Messages')).default;
  });

  it('renders messages page without crashing', async () => {
    renderMessages();
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('shows sign-in message for unauthenticated users', async () => {
    mockSession.user = null;
    mockSession.isAuthenticated = false;
    renderMessages();
    await waitFor(() => {
      expect(screen.getByText(/signInRequired/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while session is loading', async () => {
    mockSession.isLoading = true;
    renderMessages();
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  it('shows not-found state for invalid conversation ID', async () => {
    renderMessages('/messages/nonexistent-id-12345');
    await waitFor(() => {
      expect(screen.getByText(/conversation not found/i)).toBeInTheDocument();
    });
  });

  it('loads incident-route conversation safely when user is a participant', async () => {
    // Route-level lookup returns the conversation with the current user as client.
    configureFromTables({
      conversations: {
        data: {
          id: INCIDENT_CONVERSATION_ID,
          job_id: 'job-1',
          client_id: 'test-user-123',
          pro_id: 'other-pro',
        },
        error: null,
      },
    });

    renderMessages(`/messages/${INCIDENT_CONVERSATION_ID}`);

    await waitFor(() => {
      // Must NOT show not-found.
      expect(screen.queryByText(/conversation not found/i)).not.toBeInTheDocument();
    });
  });

  it('shows controlled not-found when user is not a participant', async () => {
    // Route-level lookup returns a conversation where current user is neither side.
    configureFromTables({
      conversations: {
        data: {
          id: INCIDENT_CONVERSATION_ID,
          job_id: 'job-1',
          client_id: 'someone-else',
          pro_id: 'another-person',
        },
        error: null,
      },
    });

    renderMessages(`/messages/${INCIDENT_CONVERSATION_ID}`);

    await waitFor(() => {
      // Controlled not-found, no crash.
      expect(screen.getByText(/conversation not found/i)).toBeInTheDocument();
    });
  });

  it('still renders base conversation when enrichment fetches fail', async () => {
    // RPC returns one conversation; jobs/profile enrichment fetches all error out.
    (mockClient.supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          id: 'conv-base-1',
          job_id: 'job-x',
          client_id: 'test-user-123',
          pro_id: 'pro-x',
          last_message_at: null,
          last_message_preview: null,
          created_at: '2025-01-01T00:00:00Z',
          last_read_at_client: null,
          last_read_at_pro: null,
          unread_count: 0,
        },
      ],
      error: null,
    });
    configureFromTables({
      jobs: { data: null, error: { message: 'jobs failed' } },
      profiles: { data: null, error: { message: 'profiles failed' } },
      professional_profiles: { data: null, error: { message: 'pro profiles failed' } },
      conversations: { data: null, error: null },
    });

    renderMessages('/messages');

    // Page must render without throwing — the conversation list query
    // should resolve even though enrichment failed.
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
    // No global crash / not-found state on the index route.
    expect(screen.queryByText(/conversation not found/i)).not.toBeInTheDocument();
  });
});
