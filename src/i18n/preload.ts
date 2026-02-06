import i18n from './index';
import { NS } from './namespaces';

// All namespaces we want to preload
const CORE_NAMESPACES = Object.values(NS);

/**
 * Preload a language's namespaces before switching
 * Prevents visible lag on first switch
 */
export async function changeLanguageSafe(lng: string): Promise<void> {
  // Load the language bundle first
  await i18n.loadLanguages(lng);
  // Ensure all namespaces are loaded
  await i18n.loadNamespaces(CORE_NAMESPACES);
  // Now switch - instant because everything is cached
  await i18n.changeLanguage(lng);
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
  i18n.loadNamespaces(CORE_NAMESPACES);
}
