import { storage } from "@shared/utils/storage";
import { STORAGE_KEYS } from "@/constants";
import { getLocales } from "expo-localization";

/**
 * MMKV Language Detector Plugin para i18next
 *
 * Detecta el idioma del usuario en este orden:
 * 1. Idioma guardado en MMKV (preferencia del usuario)
 * 2. Idioma del dispositivo (si está soportado)
 * 3. Fallback a español
 */
export const mmkvLanguageDetector = {
  type: "languageDetector" as const,
  async: false,
  init: () => {
    // No initialization needed
  },
  detect: (): string => {
    // 1. Intentar obtener idioma guardado en MMKV
    const savedLanguage = storage.getString(STORAGE_KEYS.LANGUAGE);
    if (savedLanguage) {
      console.log("[i18n] Using saved language:", savedLanguage);
      return savedLanguage;
    }

    // 2. Detectar idioma del dispositivo
    const deviceLocales = getLocales();
    const deviceLanguage = deviceLocales[0]?.languageCode || "es";

    // 3. Verificar si el idioma del dispositivo está soportado
    const supportedLanguages = ["en", "es"];
    const finalLanguage = supportedLanguages.includes(deviceLanguage)
      ? deviceLanguage
      : "es";

    console.log("[i18n] Device language:", deviceLanguage);
    console.log("[i18n] Using language:", finalLanguage);

    return finalLanguage;
  },
  cacheUserLanguage: (language: string): void => {
    console.log("[i18n] Saving language preference:", language);
    storage.set(STORAGE_KEYS.LANGUAGE, language);
  },
};
