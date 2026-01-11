import ToastLib from "react-native-toast-message";
import { i18n } from "@shared/i18n";

/**
 * Default durations for different toast types (in milliseconds)
 */
const DEFAULT_DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 5000,
  info: 3000,
  primary: 3000,
  loading: 0, // Indefinite - must be manually dismissed
};

/**
 * Toast options interface
 */
export interface ToastOptions {
  title?: string;
  message?: string;
  duration?: number;
}

/**
 * Detects if a string is a translation key and translates it
 * Translation keys are expected to have the format: namespace.key
 *
 * @param text - The text to translate (or plain text)
 * @returns Translated text or original text if not a translation key
 */
function translateText(text: string): string {
  if (!text) return text;

  // Detect if it looks like a translation key (contains a dot)
  if (text.includes(".")) {
    // Convert namespace.key to namespace:key for i18next
    const i18nKey = text.replace(".", ":");
    const translated = i18n.t(i18nKey as any) as string;
    // If translation found and different from key, use it
    // Otherwise, use the original text (could be plain text with a dot)
    return translated !== i18nKey ? translated : text;
  }

  return text;
}

/**
 * Shows a toast with the given type and options
 */
function showToast(
  type: "success" | "error" | "warning" | "info" | "primary" | "loading",
  titleOrOptions: string | ToastOptions,
  options?: Omit<ToastOptions, "title">
): string {
  let title: string;
  let message: string | undefined;
  let duration: number;

  // Handle both string and object inputs
  if (typeof titleOrOptions === "string") {
    title = titleOrOptions;
    message = options?.message;
    duration = options?.duration ?? DEFAULT_DURATIONS[type];
  } else {
    title = titleOrOptions.title || "";
    message = titleOrOptions.message;
    duration = titleOrOptions.duration ?? DEFAULT_DURATIONS[type];
  }

  // Translate title and message if they're translation keys
  const translatedTitle = translateText(title);
  const translatedMessage = message ? translateText(message) : undefined;

  // Show the toast
  ToastLib.show({
    type,
    text1: translatedTitle,
    text2: translatedMessage,
    visibilityTime: duration,
    position: "top",
    topOffset: 60,
    swipeable: true,
    autoHide: duration > 0,
  });

  // Return a unique ID for this toast (using timestamp)
  return `${type}-${Date.now()}`;
}

/**
 * Toast helper object with semantic methods
 */
export const toast = {
  /**
   * Show a success toast
   * @param titleOrOptions - Translation key, plain text, or options object
   * @param options - Additional options (only if first param is string)
   */
  success: (
    titleOrOptions: string | ToastOptions,
    options?: Omit<ToastOptions, "title">
  ): void => {
    showToast("success", titleOrOptions, options);
  },

  /**
   * Show an error toast
   * @param titleOrOptions - Translation key, plain text, or options object
   * @param options - Additional options (only if first param is string)
   */
  error: (
    titleOrOptions: string | ToastOptions,
    options?: Omit<ToastOptions, "title">
  ): void => {
    showToast("error", titleOrOptions, options);
  },

  /**
   * Show a warning toast
   * @param titleOrOptions - Translation key, plain text, or options object
   * @param options - Additional options (only if first param is string)
   */
  warning: (
    titleOrOptions: string | ToastOptions,
    options?: Omit<ToastOptions, "title">
  ): void => {
    showToast("warning", titleOrOptions, options);
  },

  /**
   * Show an info toast
   * @param titleOrOptions - Translation key, plain text, or options object
   * @param options - Additional options (only if first param is string)
   */
  info: (
    titleOrOptions: string | ToastOptions,
    options?: Omit<ToastOptions, "title">
  ): void => {
    showToast("info", titleOrOptions, options);
  },

  /**
   * Show a primary branded toast
   * @param titleOrOptions - Translation key, plain text, or options object
   * @param options - Additional options (only if first param is string)
   */
  primary: (
    titleOrOptions: string | ToastOptions,
    options?: Omit<ToastOptions, "title">
  ): void => {
    showToast("primary", titleOrOptions, options);
  },

  /**
   * Show a loading toast (must be manually dismissed)
   * @param titleOrOptions - Translation key, plain text, or options object
   * @param options - Additional options (only if first param is string)
   * @returns Toast ID for later dismissal
   */
  loading: (
    titleOrOptions: string | ToastOptions,
    options?: Omit<ToastOptions, "title">
  ): string => {
    return showToast("loading", titleOrOptions, options);
  },

  /**
   * Hide a specific toast or all toasts
   * @param toastId - Optional toast ID to hide specific toast
   */
  hide: (toastId?: string): void => {
    ToastLib.hide();
  },
};
