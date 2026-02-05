 import { useTranslation } from "react-i18next";
 import { NS } from "@/i18n/namespaces";
 
 /**
  * Temporary smoke test component to verify i18n switching works.
  * Remove after verification is complete.
  */
 export function I18nSmokeTest() {
   const { t } = useTranslation(NS.common);
   return (
     <span className="text-xs opacity-60 font-mono">
       {t("debug.hello")}
     </span>
   );
 }