/**
 * Shared i18n mock.
 * Returns the translation key (or fallback string) for easy assertion.
 */
import { vi } from 'vitest';
import type { ReactNode } from 'react';

export function createMockI18n() {
  return {
    useTranslation: (_ns?: string | string[]) => ({
      t: (key: string, fallback?: string | Record<string, unknown>) =>
        typeof fallback === 'string' ? fallback : key,
      ready: true,
      i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
    Trans: ({ children }: { children: ReactNode }) => children,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
  };
}
