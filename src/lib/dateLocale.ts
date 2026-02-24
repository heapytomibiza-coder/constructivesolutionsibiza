/**
 * Shared date-fns locale utility.
 * Ensures formatDistanceToNow / format() respect the active i18n language.
 */
import { es } from 'date-fns/locale/es';
import { enUS } from 'date-fns/locale/en-US';
import i18n from '@/i18n';
import type { Locale } from 'date-fns';

const localeMap: Record<string, Locale> = {
  es,
  en: enUS,
};

/** Returns the date-fns Locale matching the current i18n language */
export function getDateLocale(): Locale {
  const lang = i18n.language?.split('-')[0] ?? 'en';
  return localeMap[lang] ?? enUS;
}
