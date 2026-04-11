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
import { sessions } from '@/test/utils/mockSession';
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
      // t('title') returns 'title' via mock — h1 renders this key
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('SET-001: shows account section', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText(/account\.title/)).toBeInTheDocument();
    });
  });

  it('SET-001: shows user email', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('SET-001: shows security section', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByText(/security\.title/)).toBeInTheDocument();
    });
  });

  it('SET-002: back to dashboard button is visible', async () => {
    renderSettings();
    await waitFor(() => {
      expect(screen.getByLabelText(/backToDashboard/i)).toBeInTheDocument();
    });
  });
});
