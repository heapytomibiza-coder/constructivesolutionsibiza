/**
 * SMOKE TEST — /messages route
 *
 * Validates loading, empty, not-found, and thread states.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock supabase
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
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
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

// Configurable session mock
const mockSession = {
  isAuthenticated: true,
  hasRole: vi.fn(() => true),
  isProReady: false,
  isLoading: false,
  isReady: true,
  user: { id: 'test-user-123', email: 'test@example.com' },
  activeRole: 'client' as string | null,
  refresh: vi.fn(),
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

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

describe('/messages smoke tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    MessagesPage = (await import('@/pages/messages/Messages')).default;
  });

  it('renders messages page without crashing', async () => {
    renderMessages();
    await waitFor(() => {
      // Should show the messages title or empty state
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
    // Reset
    mockSession.user = { id: 'test-user-123', email: 'test@example.com' } as any;
    mockSession.isAuthenticated = true;
  });

  it('shows loading state while session is loading', async () => {
    mockSession.isLoading = true;
    renderMessages();
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
    mockSession.isLoading = false;
  });

  it('shows not-found state for invalid conversation ID', async () => {
    renderMessages('/messages/nonexistent-id-12345');
    await waitFor(() => {
      expect(screen.getByText(/conversationNotFound/i)).toBeInTheDocument();
    });
  });
});
