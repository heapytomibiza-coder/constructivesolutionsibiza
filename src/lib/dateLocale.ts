import { es } from 'date-fns/locale/es';
import { enUS } from 'date-fns/locale/en-US';
import i18n from '@/i18n';

const localeMap: Record<string, Locale> = { es, en: enUS };

/** Returns the date-fns locale matching the current i18n language */
export function getDateLocale(): Locale {
  const lang = i18n.language?.split('-')[0] || 'en';
  return localeMap[lang] ?? enUS;
}
