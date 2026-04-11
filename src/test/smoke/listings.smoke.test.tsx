/**
 * SMOKE TEST — Professional listings page
 * Covers: LIST-001 (render + heading), LIST-002 (tab controls), LIST-004 (missing user)
 * Health alert link: listing visibility → listings page must render for professionals
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

const mockSession = sessions.professional();

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderListings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/dashboard/pro/listings']}>
        <ListingsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

let ListingsPage: React.ComponentType;

describe('Professional listings smoke tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    Object.assign(mockSession, sessions.professional());
    ListingsPage = (await import('@/pages/professional/MyServiceListings')).default;
  });

  it('LIST-001: renders listings page heading', async () => {
    renderListings();
    await waitFor(() => {
      // Heading uses t('pro.manageListings', 'Manage Listings') — mock returns fallback
      expect(screen.getByRole('heading', { name: /manage listings/i })).toBeInTheDocument();
    });
  });

  it('LIST-001: shows tab controls (Draft, Live, Paused)', async () => {
    renderListings();
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  it('LIST-001: shows Add/Remove Categories button', async () => {
    renderListings();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add.*remove.*categories/i })).toBeInTheDocument();
    });
  });

  it('LIST-004: handles missing user without crashing', async () => {
    mockSession.user = null as any;
    renderListings();
    await waitFor(() => {
      // Should still render the page structure
      expect(screen.getByRole('heading', { name: /manage listings/i })).toBeInTheDocument();
    });
    Object.assign(mockSession, sessions.professional());
  });
});
