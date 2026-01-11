import { useTranslation } from "react-i18next";
import { getLocales } from "expo-localization";

/**
 * Idiomas soportados en la aplicación
 */
export type Language = "en" | "es";

/**
 * Hook personalizado para gestión de idioma
 *
 * Proporciona:
 * - Idioma actual
 * - Función para cambiar idioma
 * - Idioma del dispositivo
 * - Helpers de verificación
 *
 * @example
 * const { currentLanguage, changeLanguage, isSpanish } = useLanguage();
 *
 * // Cambiar a inglés
 * changeLanguage('en');
 *
 * // Verificar idioma actual
 * if (isSpanish) {
 *   // Lógica específica para español
 * }
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as Language;

  /**
   * Cambia el idioma de la aplicación
   * Persiste automáticamente en MMKV
   */
  const changeLanguage = async (language: Language) => {
    await i18n.changeLanguage(language);
  };

  /**
   * Obtiene el idioma del dispositivo
   */
  const deviceLanguage = (getLocales()[0]?.languageCode as Language) || "es";

  return {
    /** Idioma actual de la aplicación */
    currentLanguage,

    /** Función para cambiar el idioma */
    changeLanguage,

    /** Idioma detectado del dispositivo */
    deviceLanguage,

    /** true si el idioma actual es inglés */
    isEnglish: currentLanguage === "en",

    /** true si el idioma actual es español */
    isSpanish: currentLanguage === "es",
  };
}
