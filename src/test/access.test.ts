import { describe, it, expect } from 'vitest';
import { checkAccess, type AccessContext, type Role } from '@/guard/access';

function makeCtx(overrides: Partial<AccessContext> = {}): AccessContext {
  return {
    isAuthenticated: false,
    hasRole: () => false,
    isProReady: false,
    userEmail: null,
    ...overrides,
  };
}

describe('checkAccess', () => {
  it('public routes always accessible', () => {
    expect(checkAccess('public', makeCtx())).toBe(true);
  });

  it('auth routes require authentication', () => {
    expect(checkAccess('auth', makeCtx())).toBe(false);
    expect(checkAccess('auth', makeCtx({ isAuthenticated: true }))).toBe(true);
  });

  it('role:client requires client role', () => {
    expect(checkAccess('role:client', makeCtx({ isAuthenticated: true }))).toBe(false);
    expect(checkAccess('role:client', makeCtx({
      isAuthenticated: true,
      hasRole: (r: Role) => r === 'client',
    }))).toBe(true);
  });

  it('role:professional requires professional role', () => {
    expect(checkAccess('role:professional', makeCtx({
      isAuthenticated: true,
      hasRole: (r: Role) => r === 'professional',
    }))).toBe(true);
  });

  it('proReady requires professional role AND isProReady', () => {
    // Has role but not ready
    expect(checkAccess('proReady', makeCtx({
      isAuthenticated: true,
      hasRole: (r: Role) => r === 'professional',
      isProReady: false,
    }))).toBe(false);

    // Has role and is ready
    expect(checkAccess('proReady', makeCtx({
      isAuthenticated: true,
      hasRole: (r: Role) => r === 'professional',
      isProReady: true,
    }))).toBe(true);
  });

  it('admin requires admin role only (no email check)', () => {
    // Not admin
    expect(checkAccess('admin', makeCtx({ isAuthenticated: true }))).toBe(false);

    // Has admin role — should pass (DB handles real security)
    expect(checkAccess('admin', makeCtx({
      isAuthenticated: true,
      hasRole: (r: Role) => r === 'admin',
    }))).toBe(true);
  });

  it('admin blocked for unauthenticated users', () => {
    expect(checkAccess('admin', makeCtx({
      isAuthenticated: false,
      hasRole: (r: Role) => r === 'admin',
    }))).toBe(false);
  });

  it('unknown access rule denied by default', () => {
    expect(checkAccess('unknown_rule' as any, makeCtx({ isAuthenticated: true }))).toBe(false);
  });
});
