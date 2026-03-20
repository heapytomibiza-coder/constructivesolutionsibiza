/**
 * Admin query key factory for consistent cache management
 */
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: (filter?: string, search?: string) => [...adminKeys.all, 'users', { filter, search }] as const,
  jobs: (filter?: string, search?: string) => [...adminKeys.all, 'jobs', { filter, search }] as const,
  content: (filter?: string, type?: string, search?: string) => [...adminKeys.all, 'content', { filter, type, search }] as const,
  support: (filter?: string) => [...adminKeys.all, 'support', { filter }] as const,
  supportDetail: (id: string) => [...adminKeys.all, 'support', id] as const,
  jobDetail: (id: string) => [...adminKeys.all, 'jobDetail', id] as const,
  userDetail: (id: string) => [...adminKeys.all, 'userDetail', id] as const,
  disputes: () => [...adminKeys.all, 'disputes'] as const,
};
