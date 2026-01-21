import { MMKV } from 'react-native-mmkv';
import { getLocales } from "expo-localization";

// Create MMKV instance for i18n
const i18nStorage = new MMKV({ id: 'i18n-storage' });

const LANGUAGE_KEY = 'language';

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
    const savedLanguage = i18nStorage.getString(LANGUAGE_KEY);
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
    i18nStorage.set(LANGUAGE_KEY, language);
  },
};
