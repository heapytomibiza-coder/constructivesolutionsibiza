/**
 * SMOKE TEST — /post route & Canonical Job Wizard
 *
 * Covers: render, loading, category step, navigation, unauthenticated guard,
 * wizard type exports, and empty-state safety.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Supabase mock ──────────────────────────────────────────────
const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/img.jpg' } })),
      })),
    },
  },
}));

// ── i18n mock ──────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === 'string' ? fallback : key,
    ready: true,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// ── Utility mocks ──────────────────────────────────────────────
vi.mock('@/lib/trackEvent', () => ({ trackEvent: vi.fn() }));
vi.mock('@/i18n/taxonomyTranslations', () => ({
  txCategory: (slug: string) => slug,
  txSubcategory: (slug: string) => slug,
  txMicro: (slug: string) => slug,
}));

// ── Configurable session mock ──────────────────────────────────
const mockSession = {
  isAuthenticated: false,
  hasRole: vi.fn(() => false),
  isProReady: false,
  isLoading: false,
  isReady: true,
  user: null as { id: string; email: string } | null,
  activeRole: null as string | null,
  refresh: vi.fn(),
};

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

// ── Hero image mock ────────────────────────────────────────────
vi.mock('@/assets/heroes/hero-post.webp', () => ({ default: '' }));

// ── Helpers ────────────────────────────────────────────────────
function renderPost(route = '/post') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <PostJobPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

let PostJobPage: React.ComponentType;

// ═══════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════

describe('/post smoke tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset session to unauthenticated
    mockSession.isAuthenticated = false;
    mockSession.user = null;
    mockSession.activeRole = null;
    // Clear any stored wizard state
    sessionStorage.clear();
    localStorage.removeItem('wizardState');
    PostJobPage = (await import('@/pages/jobs/PostJob')).default;
  });

  it('renders the /post page without crashing', async () => {
    renderPost();
    await waitFor(() => {
      // Navigation bar with cancel button should be present
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });
  });

  it('renders the wizard container inside PostJob', async () => {
    renderPost();
    await waitFor(() => {
      // The page should contain the wizard — check for category step or search bar
      const container = document.querySelector('.container');
      expect(container).toBeTruthy();
    });
  });

  it('renders with unauthenticated user (wizard is public, auth at submit)', async () => {
    // /post should NOT redirect unauthenticated users — auth happens at submission
    mockSession.isAuthenticated = false;
    mockSession.user = null;
    renderPost();
    await waitFor(() => {
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });
  });

  it('renders with authenticated user', async () => {
    mockSession.isAuthenticated = true;
    mockSession.user = { id: 'user-1', email: 'test@example.com' };
    mockSession.activeRole = 'client';
    renderPost();
    await waitFor(() => {
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });
  });
});

describe('Wizard types and utilities', () => {
  it('STEP_ORDER contains all 7 steps in correct order', async () => {
    const { STEP_ORDER, WizardStep } = await import(
      '@/features/wizard/canonical/types'
    );
    expect(STEP_ORDER).toHaveLength(7);
    expect(STEP_ORDER[0]).toBe(WizardStep.Category);
    expect(STEP_ORDER[6]).toBe(WizardStep.Review);
  });

  it('getNextStep and getPrevStep navigate correctly', async () => {
    const { getNextStep, getPrevStep, WizardStep } = await import(
      '@/features/wizard/canonical/types'
    );
    expect(getNextStep(WizardStep.Category)).toBe(WizardStep.Subcategory);
    expect(getNextStep(WizardStep.Subcategory)).toBe(WizardStep.Micro);
    expect(getPrevStep(WizardStep.Category)).toBeUndefined();
    expect(getPrevStep(WizardStep.Review)).toBe(WizardStep.Extras);
    expect(getNextStep(WizardStep.Review)).toBeUndefined();
  });

  it('EMPTY_WIZARD_STATE has safe defaults', async () => {
    const { EMPTY_WIZARD_STATE } = await import(
      '@/features/wizard/canonical/types'
    );
    expect(EMPTY_WIZARD_STATE.mainCategory).toBe('');
    expect(EMPTY_WIZARD_STATE.microIds).toEqual([]);
    expect(EMPTY_WIZARD_STATE.answers.microAnswers).toEqual({});
    expect(EMPTY_WIZARD_STATE.logistics.location).toBe('');
    expect(EMPTY_WIZARD_STATE.extras.photos).toEqual([]);
    expect(EMPTY_WIZARD_STATE.dispatchMode).toBe('broadcast');
    expect(EMPTY_WIZARD_STATE.wizardMode).toBe('structured');
  });

  it('isValidStep correctly validates step strings', async () => {
    const { isValidStep } = await import(
      '@/features/wizard/canonical/types'
    );
    expect(isValidStep('category')).toBe(true);
    expect(isValidStep('review')).toBe(true);
    expect(isValidStep('nonexistent')).toBe(false);
    expect(isValidStep('')).toBe(false);
  });
});

describe('Wizard state safety', () => {
  it('corrupted localStorage wizardState does not crash page', async () => {
    localStorage.setItem('wizardState', '{{{invalid json');
    PostJobPage = (await import('@/pages/jobs/PostJob')).default;
    // Should not throw
    expect(() => renderPost()).not.toThrow();
  });

  it('empty localStorage wizardState does not crash page', async () => {
    localStorage.setItem('wizardState', '');
    PostJobPage = (await import('@/pages/jobs/PostJob')).default;
    expect(() => renderPost()).not.toThrow();
  });
});
