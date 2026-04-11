/**
 * INTERACTION TEST — Messaging flows
 * Covers: MSG-002 (messages page renders), MSG-003 (auth required)
 * Health alert link: failed email notifications → message UI must still function
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockSupabase } from '@/test/utils/mockSupabase';
import { createMockI18n } from '@/test/utils/mockI18n';
import { sessions } from '@/test/utils/mockSession';

vi.mock('@/integrations/supabase/client', () => createMockSupabase());
vi.mock('react-i18next', () => createMockI18n());
vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const mockSession = sessions.client();

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let MessagesPage: React.ComponentType;

describe('Messaging interaction tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    Object.assign(mockSession, sessions.client());
    MessagesPage = (await import('@/pages/messages/Messages')).default;
  });

  it('MSG-002: messages page renders for authenticated user', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/messages']}>
          <Routes>
            <Route path="/messages" element={<MessagesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      // Messages page should show conversation list or empty state — not sign-in required
      expect(screen.queryByText(/signInRequired/i)).not.toBeInTheDocument();
    });
  });

  it('MSG-003: unauthenticated user sees sign-in required message', async () => {
    Object.assign(mockSession, sessions.guest());

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/messages']}>
          <Routes>
            <Route path="/messages" element={<MessagesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/signInRequired/i)).toBeInTheDocument();
    });
  });
});
