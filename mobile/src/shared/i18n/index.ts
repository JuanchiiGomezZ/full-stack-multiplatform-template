/**
 * i18n module exports
 *
 * Import config para inicializar i18next
 * Import types para type-safety
 */
import "./config";
import "./types";

export { default as i18n } from "./config";
export { mmkvLanguageDetector } from "./storage";
