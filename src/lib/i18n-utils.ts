 import { TFunction } from "i18next";
 import { FieldError } from "react-hook-form";
 
 /**
  * Get translated error message for a form field.
  * If the error message is a translation key, it will be translated.
  * Otherwise, the raw message is returned.
  */
 export function getFieldError(
   t: TFunction,
   error?: FieldError
 ): string | undefined {
   if (!error?.message) return undefined;
 
   // If the message looks like a translation key (e.g., "validation.required")
   // translate it. Otherwise, return the raw message.
   const key = error.message;
   const translated = t(key, { defaultValue: key });
   return translated;
 }
 
 /**
  * Safe translation helper - returns empty string if key is undefined.
  */
 export function tr(t: TFunction, key?: string): string {
   return key ? t(key) : "";
 }
 
 /**
  * Get the current locale for Intl formatters.
  * Returns 'es-ES' for Spanish, 'en-GB' for English (default).
  */
 export function getIntlLocale(language: string): string {
   return language?.startsWith("es") ? "es-ES" : "en-GB";
 }