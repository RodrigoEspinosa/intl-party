"use client";

// Context exports
export {
  I18nProvider,
  useI18nContext,
  type I18nContextValue,
  type I18nProviderProps,
} from "./context/I18nContext";

// Hooks exports
export {
  useTranslations,
  useScopedTranslations,
  useMultipleTranslations,
  useHasTranslation,
} from "./hooks/useTranslations";

export {
  useLocale,
  useLocaleInfo,
} from "./hooks/useLocale";

export {
  useNamespace,
} from "./hooks/useNamespace";

// Component exports
export {
  Trans,
  type TransProps,
} from "./components/Trans";

export {
  LocaleSelector,
  type LocaleSelectorProps,
} from "./components/LocaleSelector";

// Re-export core types and utilities for convenience
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

// Version
export const VERSION = "0.1.0";
