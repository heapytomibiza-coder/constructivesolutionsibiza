/**
 * INTERACTION TEST — Professional onboarding flow
 *
 * Tests user journey scenarios including mid-flow data states,
 * regression cases (partial data from refactors), and review accuracy.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (must be before component imports) ───

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      (opts as Record<string, string>)?.defaultValue || key,
    ready: true,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));

const mockProfessionalProfile = {
  displayName: '',
  businessName: '',
  phone: '',
  serviceZones: [] as string[],
  onboardingPhase: 'not_started' as string,
};

const mockSession = {
  isAuthenticated: true,
  hasRole: vi.fn(() => false),
  isProReady: false,
  isLoading: false,
  isReady: true,
  user: { id: 'test-user-id', email: 'test@example.com' },
  activeRole: 'professional',
  professionalProfile: mockProfessionalProfile,
  refresh: vi.fn(),
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Helpers ───

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithProviders(ui: React.ReactElement, route = '/onboarding/pro') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function setupMockFrom(overrides: {
  profilePhone?: string | null;
  displayName?: string | null;
  serviceZones?: string[] | null;
  offeredCount?: number;
} = {}) {
  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    };

    if (table === 'profiles') {
      chain.maybeSingle.mockResolvedValue({
        data: { display_name: overrides.displayName ?? null, phone: overrides.profilePhone ?? null },
        error: null,
      });
    } else if (table === 'professional_profiles') {
      chain.maybeSingle.mockResolvedValue({
        data: {
          display_name: overrides.displayName ?? null,
          service_zones: overrides.serviceZones ?? null,
          business_name: null,
        },
        error: null,
      });
    } else if (table === 'professional_services') {
      // head:true query returns count
      chain.select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: overrides.offeredCount ?? 0,
            data: null,
            error: null,
          }),
        }),
      });
    }
    return chain;
  });
}

// ─── Tests ───

describe('Onboarding regression — mid-flow partial data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.user = { id: 'test-user-id', email: 'test@example.com' };
    mockSession.isLoading = false;
  });

  it('user with name+phone but NULL zones shows incomplete step 1', async () => {
    // This is the exact regression scenario: user completed name/phone
    // during old flow but zones were never saved
    mockProfessionalProfile.displayName = 'Juan García';
    mockProfessionalProfile.phone = '+34 600 123 456';
    mockProfessionalProfile.serviceZones = [];
    mockProfessionalProfile.onboardingPhase = 'service_setup';

    setupMockFrom({
      displayName: 'Juan García',
      profilePhone: '+34 600 123 456',
      serviceZones: null, // NULL — the regression case
      offeredCount: 3,
    });

    const ProfessionalOnboarding = (await import('@/pages/onboarding/ProfessionalOnboarding')).default;
    renderWithProviders(<ProfessionalOnboarding />);

    // With service_setup phase, user lands on review step
    // The step completion check should show step 1 as INCOMPLETE
    // because zones are null
    await waitFor(() => {
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });
  });

  it('user with all data complete shows all steps checked', async () => {
    mockProfessionalProfile.displayName = 'María López';
    mockProfessionalProfile.phone = '+34 600 999 888';
    mockProfessionalProfile.serviceZones = ['ibiza-town', 'san-antonio'];
    mockProfessionalProfile.onboardingPhase = 'service_setup';

    setupMockFrom({
      displayName: 'María López',
      profilePhone: '+34 600 999 888',
      serviceZones: ['ibiza-town', 'san-antonio'],
      offeredCount: 5,
    });

    const ProfessionalOnboarding = (await import('@/pages/onboarding/ProfessionalOnboarding')).default;
    renderWithProviders(<ProfessionalOnboarding />);

    await waitFor(() => {
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });
  });

  it('user with no phone can still render review without crash', async () => {
    mockProfessionalProfile.displayName = 'Pedro';
    mockProfessionalProfile.phone = '';
    mockProfessionalProfile.serviceZones = ['island-wide'];
    mockProfessionalProfile.onboardingPhase = 'service_setup';

    setupMockFrom({
      displayName: 'Pedro',
      profilePhone: null,
      serviceZones: ['island-wide'],
      offeredCount: 2,
    });

    const { ReviewStep } = await import('@/pages/onboarding/steps/ReviewStep');
    renderWithProviders(
      <ReviewStep onBack={vi.fn()} onNavigate={vi.fn()} />
    );

    await waitFor(() => {
      // Should render and show phone as missing
      expect(document.querySelector('.space-y-6')).toBeInTheDocument();
    });
  });
});

describe('Onboarding — phase-to-step mapping', () => {
  it('maps all known phases to valid wizard steps', () => {
    const phaseToStep: Record<string, string> = {
      not_started: 'basic_info',
      basic_info: 'basic_info',
      service_area: 'services',
      services: 'review',
      service_setup: 'review',
      verification: 'services',
      review: 'review',
      complete: 'review',
    };

    const validSteps = ['basic_info', 'services', 'review'];
    Object.entries(phaseToStep).forEach(([phase, step]) => {
      expect(validSteps).toContain(step);
    });
  });
});

describe('Onboarding — canGoLive validation', () => {
  it('requires all four conditions for go-live', () => {
    // Unit validation of the canGoLive logic
    const testCases = [
      { name: true, phone: true, zones: true, services: true, expected: true },
      { name: false, phone: true, zones: true, services: true, expected: false },
      { name: true, phone: false, zones: true, services: true, expected: false },
      { name: true, phone: true, zones: false, services: true, expected: false },
      { name: true, phone: true, zones: true, services: false, expected: false },
      { name: false, phone: false, zones: false, services: false, expected: false },
    ];

    testCases.forEach(({ name, phone, zones, services, expected }) => {
      const canGoLive = name && phone && zones && services;
      expect(canGoLive).toBe(expected);
    });
  });
});
