/**
 * Shared mock for Supabase client.
 * Provides a comprehensive mock with chainable query builder.
 */
import { vi } from 'vitest';

/** Create a chainable query builder mock */
function createQueryBuilder() {
  const builder: Record<string, any> = {};
  const chainMethods = [
    'select', 'eq', 'neq', 'in', 'is', 'gte', 'lte',
    'order', 'limit', 'range', 'ilike', 'or', 'filter',
    'insert', 'update', 'upsert', 'delete',
  ];
  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnThis();
  }
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.then = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
  return builder;
}

export function createMockSupabase() {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resend: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(() => createQueryBuilder()),
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
  };
}
