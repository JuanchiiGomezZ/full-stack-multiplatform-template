import "i18next";

// Import tipos de archivos de traducción
import type commonEN from "@shared/locales/en/common.json";
import type authEN from "@shared/locales/en/auth.json";
import type toastEN from "@shared/locales/en/toast.json";

/**
 * Module augmentation de i18next para type-safety completo
 *
 * Esto proporciona:
 * - Autocomplete de translation keys en VSCode
 * - Type checking de keys inválidas
 * - Inferencia de tipos en useTranslation
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof commonEN;
      auth: typeof authEN;
      toast: typeof toastEN;
    };
  }
}
