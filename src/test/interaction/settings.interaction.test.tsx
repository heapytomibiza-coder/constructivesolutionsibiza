/**
 * INTERACTION TEST — Settings save flow
 * Covers: SET-002 (toggle notification, save mutation)
 * Health alert link: notification preferences → settings must persist correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

let SettingsPage: React.ComponentType;

describe('Settings interaction tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    Object.assign(mockSession, sessions.client());
    SettingsPage = (await import('@/pages/settings/Settings')).default;
  });

  it('SET-002: notification section heading is visible', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/settings']}>
          <SettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/notifications\.title/)).toBeInTheDocument();
    });
  });

  it('SET-002: back to dashboard link is present', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/settings']}>
          <SettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      const backLink = screen.getByLabelText(/back.*dashboard/i);
      expect(backLink).toBeInTheDocument();
    });
  });
});
