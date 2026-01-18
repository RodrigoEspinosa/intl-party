// Main exports
export { I18n, createI18n, createTypedI18n } from "./i18n";

// Types
export type {
  I18nConfig,
  I18nInstance,
  TypedI18nInstance,
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  Translations,
  NestedTranslations,
  AllTranslations,
  TranslationOptions,
  TranslationFunction,
  TypedTranslationFunction,
  LocaleDetectionConfig,
  DetectionStrategy,
  GeographicConfig,
  ValidationConfig,
  CacheConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  LocaleInfo,
  FormatOptions,
  DeepKeyOf,
  MessageFormatConfig,
} from "./types";

// Import for internal use
import type { I18nConfig } from "./types";

// Utilities
export {
  TranslationStore,
  createTranslationStore,
  deepMerge,
  flattenTranslations,
  unflattenTranslations,
} from "./utils/translation";

// ICU MessageFormat utilities
export {
  isICUFormat,
  isLegacyFormat,
  detectMessageFormat,
  formatICUMessage,
  isICULibraryAvailable,
  clearICUCache,
  getICUCacheStats,
  DEFAULT_MESSAGE_FORMAT_CONFIG,
} from "./utils/icu-formatter";

// Detection
export {
  LocaleDetector,
  createLocaleDetector,
  type DetectionContext,
  type GeographicInfo,
} from "./detection";

// Validation
export {
  TranslationValidator,
  createValidator,
  validateTranslations,
} from "./validation";

// Version
export const VERSION = "0.1.0";

// Default configurations
export const DEFAULT_CONFIG: Partial<I18nConfig> = {
  locales: ["en"],
  defaultLocale: "en",
  namespaces: ["common"],
  detection: {
    strategies: ["acceptLanguage"],
    storageKey: "locale",
  },
  validation: {
    strict: false,
    logMissing: true,
    throwOnMissing: false,
    validateFormats: true,
  },
  cache: {
    maxSize: 1000,
    ttl: 0, // No TTL by default
    strategy: "lru",
  },
};

// Helper functions
export function isValidLocale(locale: string): boolean {
  try {
    new Intl.Locale(locale);
    return true;
  } catch {
    return false;
  }
}

export function normalizeLocale(locale: string): string {
  try {
    return new Intl.Locale(locale).toString();
  } catch {
    return locale.toLowerCase().replace("_", "-");
  }
}

export function getLocaleDirection(locale: string): "ltr" | "rtl" {
  const rtlLocales = [
    "ar",
    "arc",
    "ckb",
    "dv",
    "fa",
    "ha",
    "he",
    "khw",
    "ks",
    "ku",
    "ps",
    "sd",
    "ur",
    "yi",
  ];

  const baseLocale = locale.split("-")[0];
  return rtlLocales.includes(baseLocale) ? "rtl" : "ltr";
}

export function parseLocale(locale: string): {
  language: string;
  region?: string;
  script?: string;
} {
  try {
    const intlLocale = new Intl.Locale(locale);
    return {
      language: intlLocale.language,
      region: intlLocale.region,
      script: intlLocale.script,
    };
  } catch {
    const parts = locale.split("-");
    return {
      language: parts[0],
      region: parts[1],
      script: parts[2],
    };
  }
}
