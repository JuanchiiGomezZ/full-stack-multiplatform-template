import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { mmkvLanguageDetector } from "./storage";

// Import de traducciones (síncronas para mejor rendimiento en mobile)
import commonEN from "@shared/locales/en/common.json";
import authEN from "@shared/locales/en/auth.json";
import toastEN from "@shared/locales/en/toast.json";
import commonES from "@shared/locales/es/common.json";
import authES from "@shared/locales/es/auth.json";
import toastES from "@shared/locales/es/toast.json";

/**
 * Recursos de traducción organizados por idioma y namespace
 */
const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    toast: toastEN,
  },
  es: {
    common: commonES,
    auth: authES,
    toast: toastES,
  },
} as const;

/**
 * Inicialización de i18next con configuración para React Native
 */
i18n
  .use(mmkvLanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    defaultNS: "common",
    ns: ["common", "auth", "dashboard", "settings", "toast"],

    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },

    react: {
      useSuspense: false, // Importante: evita problemas en React Native
    },

    compatibilityJSON: "v4", // Formato JSON estándar, compatible con Android

    // Debug solo en desarrollo
    debug: __DEV__,
  });

export default i18n;
