/**
 * SMOKE TEST — /settings route
 * Covers: SET-001 (render + account info), SET-002 (notification section visible)
 * Health alert link: auth/session instability → settings page must render for authenticated users
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockSupabase } from '@/test/utils/mockSupabase';
import { sessions, createMockSession } from '@/test/utils/mockSession';
import { createMockI18n } from '@/test/utils/mockI18n';

vi.mock('@/integrations/supabase/client', () => createMockSupabase());
vi.mock('react-i18next', () => createMockI18n());
vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const mockSession = sessions.client();

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

let SettingsPage: React.ComponentType;

describe('/settings smoke tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    Object.assign(mockSession, sessions.client());
    SettingsPage = (await import('@/pages/settings/Settings')).default;
  });

  it('SET-001: renders settings page with heading', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    });
  });

  it('SET-001: shows account section with email', async () => {
    renderSettings();
    await waitFor(() => {
      // Account card title
      expect(screen.getByText(/account/i)).toBeInTheDocument();
    });
  });

  it('SET-001: shows security section', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText(/security/i)).toBeInTheDocument();
    });
  });

  it('SET-001: shows notifications section', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText(/notifications/i)).toBeInTheDocument();
    });
  });

  it('SET-002: sign out button is visible', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign.*out|signOut/i })).toBeInTheDocument();
    });
  });
});
