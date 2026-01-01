import { defineRouting } from "next-intl/routing";

/**
 * i18n Routing Configuration
 *
 * Defines available locales and default behavior.
 * To add a new locale, add it to the `locales` array.
 */
export const routing = defineRouting({
  // List of all supported locales
  locales: ["en", "es"],

  // Default locale when no locale is detected
  defaultLocale: "en",

  // Locale prefix strategy: 'always' | 'as-needed' | 'never'
  // 'always': /en/about, /es/about
  // 'as-needed': /about (default), /es/about
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
