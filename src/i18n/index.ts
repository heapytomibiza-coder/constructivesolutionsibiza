import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    cleanCode: true,
    ns: ["common", "auth", "jobs", "forum", "dashboard", "wizard", "onboarding", "micros", "questions", "legal", "settings", "messages", "professional"],
    defaultNS: "common",
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      // Cache bust to ensure fresh translations after deployments
      queryStringParams: { v: '2026022406' },
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
       useSuspense: false,
    },
  });

export default i18n;