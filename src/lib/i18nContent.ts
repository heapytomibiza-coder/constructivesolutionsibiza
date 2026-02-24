/**
 * Helper to read translated user-generated content fields.
 * Falls back to the original value when translation isn't available.
 */
export function getI18nField(
  original: string | null | undefined,
  i18nMap: Record<string, string> | null | undefined,
  lang: "en" | "es"
): string {
  if (i18nMap && typeof i18nMap === "object" && i18nMap[lang]) {
    return i18nMap[lang];
  }
  return original ?? "";
}

/**
 * Derive the viewer's language code for content lookup.
 */
export function getContentLang(i18nLanguage: string): "en" | "es" {
  return i18nLanguage?.startsWith("es") ? "es" : "en";
}
