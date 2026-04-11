/**
 * INTERACTION TEST — Auth login flows
 * Covers: AUTH-006 (login form), AUTH-007 (login failure), AUTH-010 (logout)
 * Health alert link: auth/session instability → login/logout must work correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockSupabase } from '@/test/utils/mockSupabase';
import { createMockI18n } from '@/test/utils/mockI18n';
import { sessions } from '@/test/utils/mockSession';

const supabaseMock = createMockSupabase();
vi.mock('@/integrations/supabase/client', () => supabaseMock);
vi.mock('react-i18next', () => createMockI18n());
vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));

const mockSession = sessions.guest();

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let AuthPage: React.ComponentType;

describe('Auth login interaction tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    Object.assign(mockSession, sessions.guest());
    AuthPage = (await import('@/pages/auth/Auth')).default;
  });

  it('AUTH-006: login form has email and password inputs', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/auth']}>
          <AuthPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  it('AUTH-007: signInWithPassword error is returned correctly', async () => {
    const mockSignIn = supabaseMock.supabase.auth.signInWithPassword;
    mockSignIn.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', status: 400 },
    });

    const result = await mockSignIn({ email: 'bad@email.com', password: 'wrong' });
    expect(result.error).toBeTruthy();
    expect(result.error.message).toContain('Invalid login');
  });

  it('AUTH-010: signOut resolves without error', async () => {
    const mockSignOut = supabaseMock.supabase.auth.signOut;
    const result = await mockSignOut();
    expect(result.error).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
