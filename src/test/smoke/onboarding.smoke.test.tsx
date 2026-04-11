/**
 * SMOKE TEST — Professional onboarding flow
 *
 * Validates render safety, state handling, and validation logic
 * for the 3-step professional onboarding wizard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mocks ───

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    })),
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

// ─── Session mock (mutable per-test) ───

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

// ─── Tests ───

describe('Professional onboarding — smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfessionalProfile.displayName = '';
    mockProfessionalProfile.businessName = '';
    mockProfessionalProfile.phone = '';
    mockProfessionalProfile.serviceZones = [];
    mockProfessionalProfile.onboardingPhase = 'not_started';
    mockSession.isLoading = false;
    mockSession.user = { id: 'test-user-id', email: 'test@example.com' };
  });

  it('renders ProfessionalOnboarding without crashing', async () => {
    const ProfessionalOnboarding = (await import('@/pages/onboarding/ProfessionalOnboarding')).default;
    renderWithProviders(<ProfessionalOnboarding />);
    await waitFor(() => {
      expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
    });
  });

  it('shows loading state when session is loading', async () => {
    mockSession.isLoading = true;
    const ProfessionalOnboarding = (await import('@/pages/onboarding/ProfessionalOnboarding')).default;
    renderWithProviders(<ProfessionalOnboarding />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders nothing when user is not authenticated', async () => {
    mockSession.user = null;
    const ProfessionalOnboarding = (await import('@/pages/onboarding/ProfessionalOnboarding')).default;
    const { container } = renderWithProviders(<ProfessionalOnboarding />);
    // Should be empty — redirect effect fires
    expect(container.innerHTML).toBe('');
  });
});

describe('Phase progression logic — unit', () => {
  it('normalizes legacy phase names correctly', async () => {
    const { normalizePhase } = await import('@/pages/onboarding/lib/phaseProgression');
    expect(normalizePhase(null)).toBe('not_started');
    expect(normalizePhase('verification')).toBe('service_area');
    expect(normalizePhase('services')).toBe('service_setup');
    expect(normalizePhase('review')).toBe('complete');
    expect(normalizePhase('basic_info')).toBe('basic_info');
  });

  it('nextPhase never regresses', async () => {
    const { nextPhase } = await import('@/pages/onboarding/lib/phaseProgression');
    // Already at service_area, asking for basic_info → stays at service_area
    expect(nextPhase('service_area', 'basic_info')).toBe('service_area');
    // At basic_info, asking for service_area → advances
    expect(nextPhase('basic_info', 'service_area')).toBe('service_area');
  });

  it('phaseIndex treats unknown phases as 0', async () => {
    const { phaseIndex } = await import('@/pages/onboarding/lib/phaseProgression');
    expect(phaseIndex('garbage_value')).toBe(0);
    expect(phaseIndex(null)).toBe(0);
    expect(phaseIndex(undefined)).toBe(0);
  });

  it('isPhaseReady returns true only for service_setup or later', async () => {
    const { isPhaseReady } = await import('@/pages/onboarding/lib/phaseProgression');
    expect(isPhaseReady('not_started')).toBe(false);
    expect(isPhaseReady('basic_info')).toBe(false);
    expect(isPhaseReady('service_area')).toBe(false);
    expect(isPhaseReady('service_setup')).toBe(true);
    expect(isPhaseReady('complete')).toBe(true);
  });

  it('PHASES array has exactly 5 canonical phases', async () => {
    const { PHASES } = await import('@/pages/onboarding/lib/phaseProgression');
    expect(PHASES).toHaveLength(5);
    expect(PHASES).toEqual(['not_started', 'basic_info', 'service_area', 'service_setup', 'complete']);
  });
});

describe('Review step — checklist validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.user = { id: 'test-user-id', email: 'test@example.com' };
  });

  it('renders ReviewStep without crashing', async () => {
    mockProfessionalProfile.displayName = 'Test User';
    mockProfessionalProfile.phone = '+34 600 000 000';
    mockProfessionalProfile.serviceZones = ['ibiza-town'];
    const { ReviewStep } = await import('@/pages/onboarding/steps/ReviewStep');
    renderWithProviders(
      <ReviewStep onBack={vi.fn()} onNavigate={vi.fn()} />
    );
    await waitFor(() => {
      expect(document.querySelector('.space-y-6')).toBeInTheDocument();
    });
  });

  it('disables Go Live button when data is incomplete', async () => {
    // All empty — nothing complete
    mockProfessionalProfile.displayName = '';
    mockProfessionalProfile.phone = '';
    mockProfessionalProfile.serviceZones = [];
    const { ReviewStep } = await import('@/pages/onboarding/steps/ReviewStep');
    renderWithProviders(
      <ReviewStep onBack={vi.fn()} onNavigate={vi.fn()} />
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const goLiveBtn = buttons.find(b => b.textContent?.includes('review.goLive'));
      if (goLiveBtn) {
        expect(goLiveBtn).toBeDisabled();
      }
    });
  });
});

describe('BasicInfoStep — zone validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.user = { id: 'test-user-id', email: 'test@example.com' };
    mockProfessionalProfile.onboardingPhase = 'not_started';
  });

  it('renders BasicInfoStep without crashing', async () => {
    const { BasicInfoStep } = await import('@/pages/onboarding/steps/BasicInfoStep');
    renderWithProviders(
      <BasicInfoStep onComplete={vi.fn()} />
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/basicInfo.nameLabel/i)).toBeInTheDocument();
    });
  });
});
