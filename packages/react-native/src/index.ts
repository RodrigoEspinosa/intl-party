// Re-export everything from @intl-party/react for convenience
export {
  I18nProvider,
  useI18nContext,
  useOptionalI18nContext,
  useTranslations,
  useScopedTranslations,
  useMultipleTranslations,
  useHasTranslation,
  useLocale,
  useLocaleInfo,
  useNamespace,
  Trans,
  LocaleSelector,
  type I18nContextValue,
  type I18nProviderProps,
  type TransProps,
  type LocaleSelectorProps,
} from "@intl-party/react";

// Re-export core types
export type {
  I18nConfig,
  I18nInstance,
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  Translations,
  TranslationOptions,
  TranslationFunction,
} from "@intl-party/core";

// React Native specific exports
export {
  createDeviceLocaleDetector,
  type DeviceLocaleDetectorOptions,
} from "./detection/device-locale";

export {
  createAsyncStorageDetector,
  type AsyncStorageDetectorOptions,
} from "./detection/async-storage";

export {
  ReactNativeI18nProvider,
  type ReactNativeI18nProviderProps,
} from "./provider";
