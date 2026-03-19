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

