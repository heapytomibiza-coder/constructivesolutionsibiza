/**
 * Shared session mock factory.
 * Provides typed, configurable session objects for tests.
 */
import { vi } from 'vitest';

export interface MockSessionOptions {
  isAuthenticated?: boolean;
  userId?: string;
  email?: string;
  activeRole?: string | null;
  roles?: string[];
  isProReady?: boolean;
  isLoading?: boolean;
}

export function createMockSession(opts: MockSessionOptions = {}) {
  const {
    isAuthenticated = false,
    userId = 'test-user-1',
    email = 'test@example.com',
    activeRole = null,
    roles = [],
    isProReady = false,
    isLoading = false,
  } = opts;

  return {
    isAuthenticated,
    hasRole: vi.fn((r: string) => roles.includes(r)) as any,
    isProReady,
    isLoading,
    isReady: !isLoading,
    user: isAuthenticated ? { id: userId, email } as any : null,
    activeRole,
    roles,
    refresh: vi.fn(),
    switchRole: vi.fn(),
    becomeProfessional: vi.fn(),
    subscription: { plan: null, status: null, isLoading: false },
  };
}

/** Pre-built session presets */
export const sessions = {
  guest: () => createMockSession(),
  client: () => createMockSession({
    isAuthenticated: true,
    activeRole: 'client',
    roles: ['client'],
  }),
  professional: () => createMockSession({
    isAuthenticated: true,
    activeRole: 'professional',
    roles: ['client', 'professional'],
    isProReady: true,
  }),
  admin: () => createMockSession({
    isAuthenticated: true,
    userId: 'admin-1',
    email: 'admin@example.com',
    activeRole: 'admin',
    roles: ['admin'],
  }),
  loading: () => createMockSession({ isLoading: true }),
};
