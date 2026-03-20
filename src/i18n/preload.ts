import i18n from './index';
import { NS } from './namespaces';

/**
 * Boot-critical namespaces — only what the landing page needs.
 * Other namespaces load on-demand via useTranslation('dashboard'), etc.
 */
const BOOT_NAMESPACES = [NS.common, NS.lexicon];

/** All namespaces (used for language switching) */
const ALL_NAMESPACES = Object.values(NS);

/**
 * Preload a language's namespaces before switching
 * Prevents visible lag on first switch
 */
export async function changeLanguageSafe(lng: string): Promise<void> {
  await i18n.loadLanguages(lng);
  await i18n.loadNamespaces(ALL_NAMESPACES);
  await i18n.changeLanguage(lng);
}

/**
 * Preload ONLY boot-critical namespaces for current language.
 * Call on app mount — keeps initial network requests minimal.
 */
export async function preloadCoreNamespaces(): Promise<void> {
  await i18n.loadNamespaces(BOOT_NAMESPACES);
}

/**
 * Preload the alternate language in background
 * Call this on app mount after a small delay
 */
export function preloadAlternateLanguage(): void {
  const current = i18n.language?.startsWith('es') ? 'es' : 'en';
  const alternate = current === 'en' ? 'es' : 'en';

  // Load in background, don't await
  i18n.loadLanguages(alternate);
  i18n.loadNamespaces(BOOT_NAMESPACES);
}
